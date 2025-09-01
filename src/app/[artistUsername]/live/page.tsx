'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

interface Artist {
  id: string
  username: string
  artist_name: string
}

interface Session {
  id: string
  artist_id: string
  active: boolean
}

interface QueueItem {
  id: string
  song_title: string
  tip_amount: number
  customer_name: string | null
}

export default function DisplayPage() {
  const params = useParams()
  const username = params.artistUsername as string
  
  const [artist, setArtist] = useState<Artist | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadArtistAndSession()
    
    // Refresh queue every 3 seconds for more real-time feel
    const queueInterval = setInterval(() => {
      if (session) loadQueue(session.id)
    }, 3000)
    
    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => {
      clearInterval(queueInterval)
      clearInterval(clockInterval)
    }
  }, [username, session])

  const loadArtistAndSession = async () => {
    try {
      const supabase = createClient()
      
      // Get artist by username
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('username', username)
        .single()

      if (artistError || !artistData) {
        setLoading(false)
        return
      }
      
      setArtist(artistData)

      // Get active session for this artist
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('artist_id', artistData.id)
        .eq('active', true)
        .single()

      if (sessionData) {
        setSession(sessionData)
        await loadQueue(sessionData.id)
      }
    } catch (error) {
      console.error('Error loading artist/session:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQueue = async (sessionId: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('queue_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('completed', false)
        .order('tip_amount', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5) // Show more items on display

      if (data) {
        setQueue(data)
      }
    } catch (error) {
      console.error('Error loading queue:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-3xl">Loading...</div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Artist Not Found</h1>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{artist.artist_name}</h1>
          <p className="text-2xl text-gray-600">Show Not Active</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🎵 {artist.artist_name}
          </h1>
          <p className="text-2xl text-purple-200">Live Requests</p>
        </div>

        {/* Request Info Box */}
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Request a Song!</h2>
            <div className="bg-purple-100 rounded-2xl p-6 inline-block">
              <p className="text-4xl font-bold text-purple-700 mb-2">
                tunely.com/{username}
              </p>
              <p className="text-lg text-purple-600">Scan QR code or visit URL on your phone</p>
            </div>
          </div>
        </div>

        {/* Queue Display */}
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Up Next</h2>
          
          {queue.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-500">No requests yet!</p>
              <p className="text-lg text-gray-400 mt-2">Be the first to request a song</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  className={`rounded-2xl p-6 flex items-center justify-between transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white scale-105 shadow-lg' 
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`text-5xl font-bold ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`text-2xl font-semibold ${index === 0 ? 'text-white' : 'text-gray-900'}`}>
                        {item.song_title}
                      </p>
                      {item.customer_name && (
                        <p className={`text-lg ${index === 0 ? 'text-purple-200' : 'text-gray-600'}`}>
                          Requested by {item.customer_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${index === 0 ? 'text-white' : 'text-green-600'}`}>
                    ${item.tip_amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with time */}
        <div className="text-center mt-8 text-white/70">
          <p className="text-lg">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}