interface Props {
  clock?: string
}

export default function LiveBadge({ clock }: Props) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-full px-2.5 py-0.5">
      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span className="text-red-400 text-xs font-bold tracking-wider uppercase">Live</span>
      {clock && <span className="text-red-300 text-xs">{clock}</span>}
    </div>
  )
}
