type IconProps = { size?: number; className?: string };

const base = (size = 22) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export function HomeIcon({ size, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></svg>; }
export function CalendarIcon({ size, className }: IconProps) { return <svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>; }
export function BoltIcon({ size, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m13 2-9 12h8l-1 8 9-12h-8z"/></svg>; }
export function ChevronIcon({ size = 18, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m9 18 6-6-6-6"/></svg>; }
export function ClockIcon({ size = 18, className }: IconProps) { return <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>; }
export function ShieldIcon({ size = 18, className }: IconProps) { return <svg {...base(size)} className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>; }
export function ExternalIcon({ size = 16, className }: IconProps) { return <svg {...base(size)} className={className}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>; }
export function ArrowLeftIcon({ size = 21, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m15 18-6-6 6-6"/></svg>; }
export function CheckIcon({ size = 18, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m5 12 4 4L19 6"/></svg>; }
export function InfoIcon({ size = 18, className }: IconProps) { return <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>; }
export function RaidHeadIcon({ size = 18, className }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M4.1 9.1 2.5 3.7l5.2 2.2A10 10 0 0 1 12 4.8a10 10 0 0 1 4.3 1.1l5.2-2.2-1.6 5.4a8.5 8.5 0 0 1 .8 3.6c0 4.8-3.9 8.2-8.7 8.2s-8.7-3.4-8.7-8.2c0-1.3.3-2.5.8-3.6Z"/><path fill="#fff" d="m7.2 11.2 3.1 1.1-2.7 1.9-1.5-1.5 1.1-1.5Zm9.6 0 1.1 1.5-1.5 1.5-2.7-1.9 3.1-1.1ZM9 17h6l-1.1 1.2h-3.8L9 17Z"/></svg>; }
export function StarIcon({ size = 18, className }: IconProps) { return <svg {...base(size)} className={className} fill="currentColor" stroke="currentColor"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z"/></svg>; }
export function BookmarkIcon({ size = 22, className }: IconProps) { return <svg {...base(size)} className={className}><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>; }
export function ShareIcon({ size = 22, className }: IconProps) { return <svg {...base(size)} className={className}><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v8h14v-8"/></svg>; }
export function CrossedSwordsIcon({ size = 22, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m4 20 7-7M14 6l4-3 3 3-3 4M14 6l4 4M20 20l-7-7M10 6 6 6M10 6 6 3 3 6l3 4"/><path d="m5 17 2 2M17 17l2-2"/></svg>; }
export function TargetIcon({ size = 22, className }: IconProps) { return <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>; }
export function ChartIcon({ size = 22, className }: IconProps) { return <svg {...base(size)} className={className}><path d="M5 20V10M12 20V4M19 20v-7"/></svg>; }
export function GuideIcon({ size = 22, className }: IconProps) { return <svg {...base(size)} className={className}><path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 3Z"/></svg>; }
