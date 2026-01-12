

interface H2Props {
    title: string;
    className?: string;
}

export function H2({ title, className = "" }: H2Props) {
    return (
        <h2 className={`text-xl sm:text-4xl 3xl:text-[50px] font-bold ${className}`}>
            {title}
        </h2>
    )
}

interface H3Props {
    title: string;
    className?: string;
}

export function H3({ title, className = "" }: H3Props) {
    return (
        <h3 className={`text-[28px] 3xl:text-[35px] font-bold leading-9 3xl:leading-10 ${className}`}>
            {title}
        </h3>
    )
}

interface H5Props {
    title: string;
    className?: string;
}

export function H5({ title, className = "" }: H5Props) {
    return (
        <h5 className={`text-base sm:text-[22px] 3xl:text-[28px] font-bold ${className}`}>
            {title}
        </h5>
    )
}

interface H6Props {
    text: string;
    className?: string;
}

export function H6({ text, className = "" }: H6Props) {
    return (
        <h6 className={`text-xs sm:text-sm 3xl:text-[18px] font-medium ${className}`}>
            {text}
        </h6>
    )
}

interface PProps {
    text: string;
    className?: string;
}

export function P({ text, className = "" }: PProps) {
    return (
        <p className={`text-[10px] sm:text-xs 3xl:text-sm leading-[19px] ${className}`}>
            {text}
        </p>
    )
}