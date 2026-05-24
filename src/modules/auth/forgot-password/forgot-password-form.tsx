'use client'

import React from 'react'
import Label from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordForm() {
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

            <p className="text-b3 text-neutral-1000">Forgot Password</p>

            <form className="flex w-full flex-col gap-[7px]">
              <div className="flex flex-col gap-[7px]">
                <Label text="Email" htmlFor="email" />
                <Input id="email" name="email" type="email" placeholder="Enter your email" required />
              </div>

              <div className="mt-4">
                <Button type="submit" variant="primary" size="default">
                  Send Code
                </Button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-b3 text-center text-white">
          Remember your password, {' '}
          <a href="/auth/sign-in" className="underline hover:text-neutral-200">
            Sign In
          </a>
        </p>
      </div>
    </section>
  )
}
