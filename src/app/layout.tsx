import './globals.css'
import type { GetServerSideProps, InferGetServerSidePropsType, Metadata } from 'next'
import { Inter } from 'next/font/google'
import {withIronSessionSsr} from "iron-session/next";
import React from 'react';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'slack-peek3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
