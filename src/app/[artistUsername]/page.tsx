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

export default function CustomerRequestPage() {
  const params = useParams()
  const username = params.artistUsername as string
  
  const [artist, setArtist] = useState<Artist | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [songTitle, setSongTitle] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  useEffect(() => {
    loadArtistAndSession()
    const interval = setInterval(loadQueue, 5000) // Refresh queue every 5 seconds
    return () => clearInterval(interval)
  }, [username])

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

  const loadQueue = async (sessionId?: string) => {
    if (!session && !sessionId) return

    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('queue_items')
        .select('*')
        .eq('session_id', sessionId || session?.id)
        .eq('completed', false)
        .order('tip_amount', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(3)

      if (data) {
        setQueue(data)
      }
    } catch (error) {
      console.error('Error loading queue:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    const finalAmount = selectedAmount || parseFloat(tipAmount)
    
    if (!songTitle || !finalAmount || finalAmount <= 0) {
      alert('Please enter a song and tip amount')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('queue_items')
        .insert({
          session_id: session.id,
          song_title: songTitle,
          tip_amount: finalAmount,
          customer_name: customerName || null,
          completed: false
        })

      if (error) throw error

      // Show success message
      alert(`🎵 "${songTitle}" added to queue with $${finalAmount} tip!`)
      
      // Reset form
      setSongTitle('')
      setTipAmount('')
      setCustomerName('')
      setSelectedAmount(null)
      
      // Reload queue immediately
      await loadQueue()
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Artist Not Found</h1>
          <p className="text-gray-600">The artist "{username}" doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{artist.artist_name}</h1>
          <p className="text-gray-600">Not currently accepting requests.</p>
          <p className="text-sm text-gray-500 mt-4">Check back during the live performance!</p>
        </div>
      </div>
    )
  }

  const presetAmounts = [5, 10, 20, 50]

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Header */}
      <div className="bg-white rounded-t-2xl p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎵 {artist.artist_name}</h1>
        <p className="text-gray-600">Request a song with your tip!</p>
      </div>

      {/* Queue Display */}
      {queue.length > 0 && (
        <div className="bg-gray-50 p-6 border-x">
          <h2 className="font-semibold text-gray-900 mb-3">Coming Up Next:</h2>
          <div className="space-y-2">
            {queue.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-purple-600 mr-2">#{index + 1}</span>
                  <span className="font-medium">{item.song_title}</span>
                  {item.customer_name && (
                    <span className="text-sm text-gray-500 ml-2">- {item.customer_name}</span>
                  )}
                </div>
                <span className="text-green-600 font-semibold">${item.tip_amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl p-6 border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (Optional)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Anonymous"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Song Request *
          </label>
          <input
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter song name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tip Amount *
          </label>
          
          {/* Preset amounts */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(amount)
                  setTipAmount('')
                }}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedAmount === amount
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <input
            type="number"
            value={tipAmount}
            onChange={(e) => {
              setTipAmount(e.target.value)
              setSelectedAmount(null)
            }}
            min="1"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Or enter custom amount..."
          />
          
          <p className="text-xs text-gray-500 mt-1">
            💡 Higher tips move your song up in the queue!
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Adding to Queue...' : `Send Request ${selectedAmount || tipAmount ? `($${selectedAmount || tipAmount})` : ''}`}
        </button>

        <p className="text-xs text-center text-gray-500">
          Payment processing coming soon. Tips are for demo purposes only.
        </p>
      </form>
    </div>
  )
}