import { net } from 'electron'
import { store } from './store'

// Sends via Expo's free push relay → APNs → iPhone notification center.
// Token is an ExponentPushToken[...] obtained from the phone-companion Expo app.
export function sendPhoneNotification(
  title: string,
  body: string,
  _tags = '',
  priority: 'default' | 'high' = 'high',
  data: Record<string, unknown> = {},
) {
  const enabled = store.get('phoneNotifyEnabled')
  const token = store.get('expoPushToken')
  if (!enabled || !token) return

  try {
    const payload = JSON.stringify({
      to: token,
      title,
      body,
      sound: 'default',
      priority: priority === 'high' ? 'high' : 'normal',
      data,
    })
    const req = net.request({ method: 'POST', url: 'https://exp.host/--/api/v2/push/send' })
    req.setHeader('Content-Type', 'application/json')
    req.setHeader('Accept', 'application/json')
    req.on('response', (res) => { res.on('data', () => {}); res.on('end', () => {}) })
    req.on('error', () => {})
    req.write(payload)
    req.end()
  } catch { /* ignore */ }
}
