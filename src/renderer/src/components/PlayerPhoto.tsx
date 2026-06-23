import { useState } from 'react'
import type { Team } from '../types'

interface Props {
  team: Team
  side: 'home' | 'away'
}

export default function PlayerPhoto({ team, side }: Props) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = team.starPlayerPhoto && !imgError

  return (
    <div className={`flex flex-col items-center gap-1 ${side === 'away' ? 'items-end' : 'items-start'}`}>
      <div className="relative">
        {showPhoto ? (
          <img
            src={team.starPlayerPhoto}
            alt={team.starPlayer}
            onError={() => setImgError(true)}
            className="w-14 h-14 rounded-full object-cover object-top border-2 border-white/20 bg-gray-800"
          />
        ) : team.teamLogo ? (
          <img
            src={team.teamLogo}
            alt={team.name}
            className="w-14 h-14 rounded-full object-contain p-2 border-2 border-white/10 bg-gray-800/50"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-2xl">
            {team.flagEmoji}
          </div>
        )}
      </div>
      {team.starPlayer && (
        <p className="text-[10px] text-white/50 max-w-[72px] truncate text-center leading-tight">
          {team.starPlayer.split(' ').slice(-1)[0]}
        </p>
      )}
    </div>
  )
}
