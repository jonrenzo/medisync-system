"use client"

import {useState, useEffect} from 'react'

export default function Clock() {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const formatTime = (date: Date) => {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12

        return `${displayHours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`
    }

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
        return date.toLocaleDateString('en-US', options)
    }

    return (
        <div className="text-center">
            <p className="text-sm text-primary" suppressHydrationWarning>
                {formatDate(time)}
            </p>
            <p className="text-lg font-bold text-primary" suppressHydrationWarning>
                {formatTime(time)}
            </p>
        </div>
    )
}
