'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Artist {
  id: string
  username: string
  artist_name: string
  email: string
  subscribed: boolean
}

interface Session {
  id: string
  artist_id: string
  active: boolean
  start_time: string
  end_time: string | null
  total_earnings: number
}

interface QueueItem {
  id: string
  session_id: string
  song_title: string
  tip_amount: number
  customer_name: string | null
  completed: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    loadData()
    // Set up real-time subscription for queue updates
    const interval = setInterval(loadQueue, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get artist profile
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', user.id)
        .single()

      if (artistError) throw artistError
      setArtist(artistData)

      // Get active session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('artist_id', user.id)
        .eq('active', true)
        .maybeSingle()

      if (!sessionError && sessionData) {
        setSession(sessionData)
        await loadQueue(sessionData.id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQueue = async (sessionId?: string) => {
    if (!session && !sessionId) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('queue_items')
        .select('*')
        .eq('session_id', sessionId || session?.id)
        .eq('completed', false)
        .order('tip_amount', { ascending: false })
        .order('created_at', { ascending: true })

      if (!error && data) {
        setQueue(data)
      }
    } catch (error) {
      console.error('Error loading queue:', error)
    }
  }

  const startSession = async () => {
    if (!artist) return
    setStarting(true)

    try {
      const supabase = createClient()

      // End any existing active sessions first
      await supabase
        .from('sessions')
        .update({ active: false, end_time: new Date().toISOString() })
        .eq('artist_id', artist.id)
        .eq('active', true)

      // Create new session
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          artist_id: artist.id,
          active: true,
          total_earnings: 0
        })
        .select()
        .single()

      if (error) throw error
      
      setSession(data)
      setQueue([])
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start session')
    } finally {
      setStarting(false)
    }
  }

  const endSession = async () => {
    if (!session) return
    
    if (!confirm('Are you sure you want to end this session? All URLs will be deactivated.')) {
      return
    }

    setEnding(true)

    try {
      const supabase = createClient()

      // Calculate total earnings
      const { data: queueData } = await supabase
        .from('queue_items')
        .select('tip_amount')
        .eq('session_id', session.id)

      const totalEarnings = queueData?.reduce((sum, item) => sum + item.tip_amount, 0) || 0

      // End session
      const { error } = await supabase
        .from('sessions')
        .update({ 
          active: false, 
          end_time: new Date().toISOString(),
          total_earnings: totalEarnings
        })
        .eq('id', session.id)

      if (error) throw error
      
      setSession(null)
      setQueue([])
    } catch (error) {
      console.error('Error ending session:', error)
      alert('Failed to end session')
    } finally {
      setEnding(false)
    }
  }

  const markAsCompleted = async (itemId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('queue_items')
        .update({ completed: true })
        .eq('id', itemId)

      if (error) throw error
      
      // Remove from local queue
      setQueue(queue.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error marking as completed:', error)
      alert('Failed to update queue item')
    }
  }

  const calculateEarnings = () => {
    return queue.reduce((sum, item) => sum + item.tip_amount, 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Error loading profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {artist.artist_name}!
            </h2>
            <p className="text-gray-600">
              Your URL: <span className="font-mono text-purple-600">tunely.com/{artist.username}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${session ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <span className="text-sm font-medium">
                {session ? 'Session Active' : 'No Active Session'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Session Management */}
      {!session ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Start a New Session</h3>
          <p className="text-gray-600 mb-4">
            Start a live session to begin accepting song requests and tips from your audience.
          </p>
          <button 
            onClick={startSession}
            disabled={starting}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {starting ? 'Starting...' : '🎤 Start Live Session'}
          </button>
        </div>
      ) : (
        <>
          {/* Active Session Info */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Live Session Active</h3>
              <button 
                onClick={endSession}
                disabled={ending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm disabled:opacity-50"
              >
                {ending ? 'Ending...' : 'End Session'}
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-purple-100 text-sm mb-2">Session Earnings</p>
                <p className="text-3xl font-bold">${calculateEarnings().toFixed(2)}</p>
              </div>
              <div>
                <p className="text-purple-100 text-sm mb-2">Songs in Queue</p>
                <p className="text-3xl font-bold">{queue.length}</p>
              </div>
            </div>
          </div>

          {/* Session URLs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Session URLs</h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <label className="text-sm text-gray-600">Customer Request Page (Share this with audience)</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/{artist.username}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/${artist.username}`)
                      alert('Copied to clipboard!')
                    }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <label className="text-sm text-gray-600">Display Page (For projector/screen)</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/{artist.username}/live
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/${artist.username}/live`)
                      alert('Copied to clipboard!')
                    }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Display */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Song Queue</h3>
            {queue.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No song requests yet. Share your URL with the audience!
              </p>
            ) : (
              <div className="space-y-3">
                {queue.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-semibold">{item.song_title}</p>
                          <p className="text-sm text-gray-600">
                            ${item.tip_amount.toFixed(2)} tip
                            {item.customer_name && ` from ${item.customer_name}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => markAsCompleted(item.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      Mark Complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Subscription Notice */}
      {!artist.subscribed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Free Trial Active
          </h3>
          <p className="text-yellow-800 text-sm">
            Your 7-day free trial is active. Add payment details to continue after the trial.
          </p>
        </div>
      )}
    </div>
  )
}