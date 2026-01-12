interface BadgeProps {
    title: string;
    className?: string;
}

export function Badge({ title, className = "" }: BadgeProps) {
    return (
        <span className={`w-max border border-accent bg-accent/25 text-accent text-xs font-semibold px-7.25 py-1.25 rounded-[20px] ${className}`}>
            {title}
        </span>
    )
}