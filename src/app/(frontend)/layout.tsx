import React from 'react'
import './globals.css'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

const dorivalUITrial = localFont({
  src: [
    {
      path: '../../../public/fonts/DorivalUITrial-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/DorivalUITrial-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dorivaluitrial',
})

const dorivalUINrwTrial = localFont({
  src: [
    {
      path: '../../../public/fonts/DorivalUINrwTrial-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/DorivalUINrwTrial-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/DorivalUINrwTrial-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dorivaluinrwtrial',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body className={`${dorivalUITrial.variable} ${dorivalUINrwTrial.variable} ${inter.variable} antialiased`}>
        <main>{children}</main>
      </body>
    </html>
  )
}
