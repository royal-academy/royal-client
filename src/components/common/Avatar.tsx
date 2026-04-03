import { useState } from "react";

type Status = "online" | "busy" | "away" | null;

interface AvatarProps {
  name: string;
  url?: string | null;
  fallbackIcon?: React.ReactNode;
  color: string;
  size?: number;
  radius?: number;
  status?: Status;
  onClick?: () => void;
}

const STATUS_COLORS: Record<NonNullable<Status>, string> = {
  online: "#34d399",
  busy: "#f87171",
  away: "#fbbf24",
};

const Avatar = ({
  name,
  url,
  color,
  size = 64,
  radius = 20,
  status = null,
  onClick,
}: AvatarProps) => {
  const [err, setErr] = useState(false);
  const br = `${radius}px`;

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onClick} // ← add
    >
      {[0, 1.2].map((delay) => (
        <div
          key={delay}
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            backgroundColor: color,
            animation: `av-pulse 2.4s ease-out ${delay}s infinite`,
          }}
        />
      ))}

      {/* Face */}
      <div
        className="relative z-10 flex items-center justify-center text-white font-bold overflow-hidden shrink-0 transition-transform duration-200 hover:scale-105 rounded-full"
        style={{
          width: size,
          height: size,

          background: `linear-gradient(135deg, ${color}66, ${color})`,
          fontSize: Math.round(size * 0.38),
        }}
      >
        {url && !err ? (
          <img
            src={url}
            alt={name}
            onError={() => setErr(true)}
            className="w-full h-full object-cover"
            style={{ borderRadius: br }}
          />
        ) : (
          (name[0]?.toUpperCase() ?? "?")
        )}
        {/* gloss */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background:
              "linear-gradient(150deg, rgba(255,255,255,.15) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Status dot */}
      {status && (
        <div
          className="absolute z-20 rounded-full"
          style={{
            bottom: -2,
            right: -2,
            width: Math.max(10, Math.round(size * 0.18)),
            height: Math.max(10, Math.round(size * 0.18)),
            background: STATUS_COLORS[status],
            border: "2.5px solid white",
          }}
        />
      )}

      <style>{`
        @keyframes av-pulse {
          0%   { transform: scale(1);    opacity: .5; }
          100% { transform: scale(1.6);  opacity: 0;  }
        }
      `}</style>
    </div>
  );
};

export default Avatar;
