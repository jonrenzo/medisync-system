"use client"

import { useEffect, useState } from "react";

export default function Clock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(async () => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return(
        <div className='text-center'>
            <p className='text-sm'>
                {time.toLocaleDateString()}
            </p>
            <p className='text-lg font-bold'>
                {time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
            </p>
        </div>
    )
}
