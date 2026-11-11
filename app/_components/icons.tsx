type IconProps = { className?: string };
const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function BackIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="m15 18-6-6 6-6" /></svg>; }
export function BookmarkIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>; }
export function ShareIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></svg>; }
export function SwordsIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="m4 20 7-7M14 6l4-3 3 3-3 4M14 6l4 4M20 20l-7-7M10 6 6 6M10 6 6 3 3 6l3 4" /></svg>; }
export function TargetIcon({ className }: IconProps) { return <svg {...svg} className={className}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>; }
export function ChartIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>; }
export function StarOutlineIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>; }
export function CalendarIcon({ className }: IconProps) { return <svg {...svg} className={className}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>; }
export function ClockIcon({ className }: IconProps) { return <svg {...svg} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>; }
export function CheckIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="m5 12 4 4L19 6" /></svg>; }
export function HomeIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>; }
export function BagIcon({ className }: IconProps) { return <svg {...svg} className={className}><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M9 7V5a3 3 0 0 1 6 0v2M8 13h8" /></svg>; }
export function ChevronIcon({ className }: IconProps) { return <svg {...svg} className={className}><path d="m9 18 6-6-6-6" /></svg>; }
