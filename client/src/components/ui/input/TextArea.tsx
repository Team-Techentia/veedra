import { ChangeEvent, TextareaHTMLAttributes } from "react";

interface TextAreaProps {
    name: string;
    handleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    value: string;
    label: string;
    error?: string;
    rows?: number;
    className?: string;
}

export function TextArea({ name, value, handleChange, className = "", error, label, rows = 5, ...props }: TextAreaProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {

    return (
        <div className="relative">
            <textarea id={name} value={value} name={name} onChange={handleChange} placeholder=" " rows={rows}
                className={`peer w-full text-sm outline-none rounded-2xl shadow-sm px-4 py-3.5 border-2 transition-all duration-300 resize-none
                    ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}
                    ${className} bg-background`}
                {...props}
            />

            <label
                htmlFor={name}
                className={`absolute left-4 transition-all duration-300 pointer-events-none bg-background
                    ${value || error ? '-top-2.5 text-xs px-2' : 'top-3.5 text-sm'}
                    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:px-2
                    ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-blue-500'}
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                    peer-placeholder-shown:text-gray-500`}
            >
                {label}
            </label>

            {error &&
                <p className="text-xs text-red-500 mt-1.5 ml-1 animate-[slideDown_0.3s_ease-out]">{error}</p>
            }

            {!error &&
                <p className="text-xs text-gray-400 mt-1.5 ml-1">{value.length}/500 characters</p>
            }
        </div>
    );
}