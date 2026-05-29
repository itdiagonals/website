import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string
  name?: string
  type?: string
  placeholder?: string
  className?: string
  required?: boolean
}

export default function Input({
  id,
  name,
  type = 'text',
  placeholder,
  className = '',
  required = false,
  ...props
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      {...props}
      className={`w-full rounded-[6px] border border-zinc-200 bg-white px-3 py-2 text-b3 text-neutral-1000 outline-none transition-colors placeholder:text-neutral-500 focus:border-primary-300 ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    />
  )
}
