import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseTest() {
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        // Simple test to check connection
        const testConnection = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()
                if (!error) {
                    setConnected(true)
                    console.log('✅ Supabase connected successfully')
                }
            } catch (err) {
                console.error('❌ Supabase connection failed:', err)
            }
        }

        testConnection()
    }, [])

    return (
        <div>
            <p>Supabase Status: {connected ? '✅ Connected' : '❌ Not Connected'}</p>
        </div>
    )
}
