"use client"

import type React from "react"
import {Lexend} from "next/font/google"
import "./globals.css"
import {Sidebar} from "@/components/sidebar"
import {usePathname} from "next/navigation"


const lexend = Lexend({subsets: ["latin"]})

export default function ClientLayout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/"

    return (
        <html lang="en">
        <body className={lexend.className}>
        {isLoginPage ? (
            <main className="w-full bg-background">{children}</main>
        ) : (
            <div className="flex h-screen bg-background">
                <Sidebar/>
                <main className="flex-1 overflow-auto bg-background">{children}</main>
            </div>
        )}
        </body>
        </html>
    )
}
