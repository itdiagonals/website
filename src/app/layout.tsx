import React from 'react'
import './globals.css'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import SiteLayout from '../components/site-layout'

import type { Metadata } from 'next'
import { getSiteUrl, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, OG_IMAGE, TWITTER_HANDLE } from '@/src/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: ['streetwear', 'fashion', 'clothing', 'Indonesia', 'Diagonals', 'apparel', 'urban wear'],
    authors: [{ name: 'Diagonals' }],
    creator: 'Diagonals',
    publisher: 'Diagonals',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      alternateLocale: 'en_US',
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} Logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE],
    },
    icons: {
      icon: 'favicon.ico',
      shortcut: 'favicon.ico',
      apple: 'favicon.ico',
    },
    manifest: '/site.webmanifest',
    alternates: {
      canonical: '/',
    },
    category: 'fashion',
  }
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
        <SiteLayout>{children}</SiteLayout>
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-bWmGIw6dVko6Yz-f2ih-sL12'}
          data-environment={process.env.NEXT_PUBLIC_MIDTRANS_ENV || 'sandbox'}
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
