"use client";

type Props = {
  carType: string;
  imageUrl?: string | null;
  className?: string;
};

function silhouette(carType: string) {
  const suv = carType === "X90" || carType === "X70" || carType === "X50";
  const compact = carType === "X50" || carType === "IRIZ";
  const height = suv ? 92 : 72;
  const y = suv ? 78 : 96;
  const length = compact ? 430 : carType === "X90" ? 520 : 490;
  const x = (640 - length) / 2;
  return { suv, height, y, length, x, roof: suv ? 18 : 28 };
}

export function CarGraphic({ carType, imageUrl, className }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${carType} vehicle`}
        className={`mx-auto max-h-[280px] w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)] ${className ?? ""}`}
      />
    );
  }

  const shape = silhouette(carType);
  const body = `M ${shape.x + 40} ${shape.y + shape.height}
    L ${shape.x + 18} ${shape.y + shape.height - 18}
    Q ${shape.x} ${shape.y + 28} ${shape.x + 70} ${shape.y + (shape.suv ? 8 : 18)}
    L ${shape.x + shape.length * 0.38} ${shape.y - shape.roof}
    Q ${shape.x + shape.length * 0.48} ${shape.y - shape.roof - 16} ${shape.x + shape.length * 0.62} ${shape.y - shape.roof + 4}
    L ${shape.x + shape.length - 70} ${shape.y + 10}
    Q ${shape.x + shape.length} ${shape.y + 24} ${shape.x + shape.length - 16} ${shape.y + shape.height - 16}
    L ${shape.x + shape.length - 36} ${shape.y + shape.height}
    Z`;

  return (
    <svg viewBox="0 0 640 260" className={`mx-auto w-full max-w-[640px] ${className ?? ""}`} role="img" aria-label={`${carType} graphic`}>
      <defs>
        <linearGradient id="paint" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f7f7f8" />
          <stop offset="45%" stopColor="#d7d7dc" />
          <stop offset="100%" stopColor="#8d8d96" />
        </linearGradient>
        <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1c2430" />
          <stop offset="100%" stopColor="#0b0d12" />
        </linearGradient>
      </defs>
      <ellipse cx="320" cy="214" rx="190" ry="16" fill="rgba(255,255,255,0.06)" />
      <path d={body} fill="url(#paint)" />
      <path
        d={`M ${shape.x + shape.length * 0.4} ${shape.y - shape.roof + 8}
            Q ${shape.x + shape.length * 0.5} ${shape.y - shape.roof - 6} ${shape.x + shape.length * 0.66} ${shape.y - 2}
            L ${shape.x + shape.length * 0.62} ${shape.y + 36}
            L ${shape.x + shape.length * 0.36} ${shape.y + 34}
            Z`}
        fill="url(#glass)"
      />
      <circle cx={shape.x + 110} cy={shape.y + shape.height - 2} r="28" fill="#111114" stroke="#3f3f46" strokeWidth="6" />
      <circle cx={shape.x + shape.length - 110} cy={shape.y + shape.height - 2} r="28" fill="#111114" stroke="#3f3f46" strokeWidth="6" />
      <circle cx={shape.x + 110} cy={shape.y + shape.height - 2} r="10" fill="#d4af37" />
      <circle cx={shape.x + shape.length - 110} cy={shape.y + shape.height - 2} r="10" fill="#d4af37" />
      <text x="320" y="248" textAnchor="middle" fill="#a1a1aa" fontSize="13" letterSpacing="4">
        {carType}
      </text>
    </svg>
  );
}
