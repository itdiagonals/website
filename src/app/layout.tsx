import React from 'react'
import './globals.css'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'
import Script from 'next/script'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

const dorivalUITrial = localFont({
  src: [
    {
      path: '../../public/fonts/DorivalUITrial-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/DorivalUITrial-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dorivaluitrial',
})

const dorivalUINrwTrial = localFont({
  src: [
    {
      path: '../../public/fonts/DorivalUINrwTrial-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/DorivalUINrwTrial-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/DorivalUINrwTrial-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dorivaluinrwtrial',
})

const handi = localFont({
  src: [
    {
      path: '../../public/fonts/Handi-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-handi',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body className={`${dorivalUITrial.variable} ${dorivalUINrwTrial.variable} ${handi.variable} ${inter.variable} antialiased`}>
        <main>{children}</main>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key="Mid-client-bWmGIw6dVko6Yz-f2ih-sL12"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
