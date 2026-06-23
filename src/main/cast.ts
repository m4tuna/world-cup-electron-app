import { net } from 'electron'
import mdns from 'multicast-dns'
import tls from 'tls'

export interface CastDevice {
  id: string
  name: string
  ip: string
  port: number
  status: CastStatus | null
  lastSeen: number
}

export interface CastStatus {
  appName: string | null
  appId: string | null
  statusText: string | null
  isPlaying: boolean
  volume: number
  muted: boolean
}

const discovered = new Map<string, CastDevice>()
let scanInterval: NodeJS.Timeout | null = null
let updateCallback: ((devices: CastDevice[]) => void) | null = null

// ── mDNS Discovery ──────────────────────────────────────────────

export function startDiscovery(onUpdate: (devices: CastDevice[]) => void) {
  updateCallback = onUpdate
  doScan()
  scanInterval = setInterval(doScan, 30_000)
}

export function stopDiscovery() {
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null }
}

// Force an immediate status refresh of all known devices — callable from IPC
export function scanNow() {
  doScan()
  // Also directly refresh any already-known devices right now
  for (const device of discovered.values()) fetchStatus(device)
}

function doScan() {
  try {
    const m = mdns()
    const seenThisScan = new Set<string>()

    m.on('response', (response: { answers: unknown[]; additionals: unknown[] }) => {
      const records = [...response.answers, ...response.additionals]
      const srvMap = new Map<string, { target: string; port: number }>()
      const aMap = new Map<string, string>()
      const txtMap = new Map<string, Record<string, string>>()
      const ptrNames: string[] = []

      for (const r of records as Array<{ type: string; name: string; data: unknown }>) {
        if (r.type === 'PTR') ptrNames.push(String(r.data))
        if (r.type === 'SRV') {
          const d = r.data as { target: string; port: number }
          srvMap.set(r.name, { target: d.target, port: d.port })
        }
        if (r.type === 'A') aMap.set(r.name, String(r.data))
        if (r.type === 'TXT') {
          const txt: Record<string, string> = {}
          const parts = (r.data as Buffer[]).map((b) => b.toString())
          for (const part of parts) {
            const [k, v] = part.split('=')
            if (k) txt[k] = v ?? ''
          }
          txtMap.set(r.name, txt)
        }
      }

      for (const name of ptrNames) {
        const srv = srvMap.get(name)
        if (!srv) continue
        const ip = aMap.get(srv.target) ?? aMap.get(srv.target.replace(/\.$/, ''))
        if (!ip) continue
        const txt = txtMap.get(name) ?? {}
        const id = txt['id'] ?? ip
        const friendlyName = txt['fn'] ?? name.split('.')[0]

        if (seenThisScan.has(id)) continue
        seenThisScan.add(id)

        const existing = discovered.get(id)
        const device: CastDevice = {
          id,
          name: friendlyName,
          ip,
          port: srv.port,
          status: existing?.status ?? null,
          lastSeen: Date.now(),
        }
        discovered.set(id, device)
        fetchStatus(device)
      }
    })

    m.query([{ name: '_googlecast._tcp.local', type: 'PTR' }])
    setTimeout(() => {
      m.destroy()
      // Re-poll status for devices that weren't seen in this mDNS scan
      for (const [id, device] of discovered) {
        if (!seenThisScan.has(id)) fetchStatus(device)
      }
    }, 5000)
  } catch (err) {
    console.error('Cast discovery error:', err)
  }
}

// ── Status via Cast v2 protocol (JSON over TLS) ──────────────────

function fetchStatus(device: CastDevice) {
  try {
    const socket = tls.connect({ host: device.ip, port: device.port, rejectUnauthorized: false }, () => {
      sendCastMessage(socket, 'urn:x-cast:com.google.cast.tp.connection',
        'sender-0', 'receiver-0', { type: 'CONNECT' })
      sendCastMessage(socket, 'urn:x-cast:com.google.cast.receiver',
        'sender-0', 'receiver-0', { type: 'GET_STATUS', requestId: 1 })
    })

    let buf = Buffer.alloc(0)
    socket.on('data', (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk])
      while (buf.length >= 4) {
        const len = buf.readUInt32BE(0)
        if (buf.length < 4 + len) break
        const msg = buf.slice(4, 4 + len)
        buf = buf.slice(4 + len)
        try {
          const payload = parseCastMessage(msg)
          if (payload?.status) {
            const apps = payload.status.applications ?? []
            const app = apps[0]
            const vol = payload.status.volume ?? {}
            const status: CastStatus = {
              appName: app?.displayName ?? null,
              appId: app?.appId ?? null,
              statusText: app?.statusText ?? null,
              isPlaying: app ? true : false,
              volume: typeof vol.level === 'number' ? Math.round(vol.level * 100) : 100,
              muted: vol.muted ?? false,
            }
            device.status = status
            discovered.set(device.id, device)
            updateCallback?.([...discovered.values()])
          }
        } catch { /* skip bad frames */ }
        if (buf.length === 0) { socket.destroy(); break }
      }
    })

    socket.setTimeout(6000, () => socket.destroy())
    socket.on('error', () => {})
    socket.on('close', () => {
      updateCallback?.([...discovered.values()])
    })
  } catch { /* ignore */ }
}

// Minimal Cast v2 frame encode/decode (protobuf-lite subset we need)
// Cast CastMessage proto: f1=protocol_version(varint), f2=source_id, f3=dest_id,
//                         f4=namespace, f5=payload_type(varint), f6=payload_utf8
function sendCastMessage(socket: tls.TLSSocket, namespace: string, src: string, dst: string, payload: object) {
  const json = JSON.stringify(payload)

  const encodeVarint = (n: number) => {
    const bytes: number[] = []
    while (n > 0x7f) { bytes.push((n & 0x7f) | 0x80); n >>>= 7 }
    bytes.push(n)
    return Buffer.from(bytes)
  }
  const encodeString = (field: number, str: string) => {
    const val = Buffer.from(str)
    return Buffer.concat([Buffer.from([(field << 3) | 2]), encodeVarint(val.length), val])
  }
  const encodeVarintField = (field: number, n: number) => {
    return Buffer.concat([Buffer.from([(field << 3) | 0]), encodeVarint(n)])
  }

  const msg = Buffer.concat([
    encodeVarintField(1, 0),       // protocol_version = CASTV2_1_0
    encodeString(2, src),           // source_id
    encodeString(3, dst),           // destination_id
    encodeString(4, namespace),     // namespace
    encodeVarintField(5, 0),       // payload_type = STRING
    encodeString(6, json),          // payload_utf8
  ])

  const header = Buffer.alloc(4)
  header.writeUInt32BE(msg.length, 0)
  socket.write(Buffer.concat([header, msg]))
}

function parseCastMessage(buf: Buffer): Record<string, unknown> | null {
  // Extract field 6 (payload_utf8) from protobuf
  let i = 0
  while (i < buf.length) {
    const tag = buf[i++]
    const fieldNum = tag >> 3
    const wireType = tag & 0x7
    if (wireType === 2) {
      let len = 0, shift = 0
      while (true) { const b = buf[i++]; len |= (b & 0x7f) << shift; shift += 7; if (!(b & 0x80)) break }
      if (fieldNum === 6) {
        try { return JSON.parse(buf.slice(i, i + len).toString()) }
        catch { return null }
      }
      i += len
    } else if (wireType === 0) {
      while (buf[i++] & 0x80 && i < buf.length) {}
    } else break
  }
  return null
}

// ── Control ──────────────────────────────────────────────────────

export function getDevices(): CastDevice[] {
  return [...discovered.values()]
}

export function refreshStatus(deviceId: string) {
  const device = discovered.get(deviceId)
  if (device) fetchStatus(device)
}
