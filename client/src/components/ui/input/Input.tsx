import { ChangeEvent, InputHTMLAttributes } from "react";

interface InputProps {
    name: string;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    value: string;
    label: string;
    type?: string;
    error?: string;
    className?: string;
}

export function Input({ type = "text", name, value, handleChange, className = "", error, label, ...props }: InputProps & InputHTMLAttributes<HTMLInputElement>) {

    return (
        <div className="relative ">
            <input id={name} type={type} value={value} name={name} onChange={handleChange} placeholder=" "
                className={`peer w-full text-sm outline-none rounded-2xl shadow-sm px-4 py-3.5 border-2 transition-all duration-300
                    ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}
                    ${className} bg-background`}
                {...props}
            />

            <label
                htmlFor={name}
                className={`absolute left-4 transition-all duration-300 pointer-events-none bg-background rounded-2xl p-px
                    ${value || error ? '-top-2.5 text-xs px-2' : 'top-3.5 text-sm'}
                    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:px-2
                    ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-blue-500'}
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                    peer-placeholder-shown:text-gray-500`}
            >
                {label}
            </label>

            {/* {error && ( */}
                <p className="text-xs h-2 text-red-500 mt-1.5 ml-1 animate-[slideDown_0.3s_ease-out]">
                    {error}
                </p>
            {/* )} */}
        </div>
    );
}
