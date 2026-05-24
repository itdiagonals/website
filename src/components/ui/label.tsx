import React from 'react'

interface LabelProps {
  text: string
  htmlFor?: string
  className?: string
}

export default function Label({ text, htmlFor, className = '' }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-b3 text-neutral-1000 ${className}`}
    >
      {text}
    </label>
  )
}
