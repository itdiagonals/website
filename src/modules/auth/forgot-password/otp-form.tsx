'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function OtpForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    console.log('OTP submitted:', code)
  }

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/auth-bg.webp)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative z-10 flex w-full max-w-[540px] flex-col items-center gap-[26px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full rounded-[20px] bg-neutral-100 p-4 sm:p-[22px]">
          <div className="flex flex-col items-center gap-[7px]">
            <div className="flex h-[65px] w-[259px] items-center justify-center">
              <img
                src="/images/diagonals.webp"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-b3 text-center text-neutral-1000">
              Enter the 6-digit code sent to your email
            </p>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[7px]">
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-10 rounded-[6px] border border-zinc-200 bg-white text-center text-b2 text-neutral-1000 outline-none transition-colors focus:border-primary-300 sm:h-14 sm:w-12"
                  />
                ))}
              </div>

              <div className="mt-4">
                <Button type="submit" variant="primary" size="default">
                  Verify
                </Button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-b3 text-center text-white">
          Didnt receive code?{' '}
          <button type="button" className="underline hover:text-neutral-200">
            Resend
          </button>
        </p>
      </div>
    </section>
  )
}
