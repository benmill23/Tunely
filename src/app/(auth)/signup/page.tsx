'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    artistName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      console.log('Starting signup process...')

      // Check if username is already taken
      console.log('Checking username availability...')
      const { data: existingUser, error: usernameError } = await supabase
        .from('artists')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle() // Use maybeSingle instead of single

      console.log('Username check result:', { existingUser, usernameError })

      if (existingUser) {
        throw new Error('Username already taken')
      }

      // Sign up with Supabase Auth
      console.log('Creating auth user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      console.log('Auth signup result:', { authData, authError })

      if (authError) throw authError

      if (authData.user) {
        console.log('User created with ID:', authData.user.id)
        
        // Create artist profile
        console.log('Creating artist profile...')
        const artistData = {
          id: authData.user.id,
          email: formData.email,
          username: formData.username,
          artist_name: formData.artistName,
          password_hash: 'handled_by_supabase_auth',
          subscribed: false,
        }
        
        console.log('Inserting artist data:', artistData)
        
        const { data: profileData, error: profileError } = await supabase
          .from('artists')
          .insert(artistData)
          .select()
          .single()

        console.log('Profile creation result:', { profileData, profileError })

        if (profileError) {
          console.error('Profile creation failed:', profileError)
          // Try to clean up the auth user if profile creation fails
          await supabase.auth.signOut()
          throw new Error(`Failed to create artist profile: ${profileError.message}`)
        }

        console.log('Profile created successfully, attempting login...')

        // Sign in immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          console.error('Auto-login failed:', signInError)
          throw signInError
        }

        console.log('Login successful, redirecting to dashboard...')
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🎵 Tunely</h1>
        <p className="text-gray-600 mt-2">Create your artist account</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Artist/Band Name
          </label>
          <input
            type="text"
            required
            value={formData.artistName}
            onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., John & The Band"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            required
            pattern="[a-z0-9]+"
            title="Username can only contain lowercase letters and numbers"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="johnband"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your URL will be: tunely.com/{formData.username || 'username'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="••••••••"
          />
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            📌 Note: $12.99/month subscription starts after 7-day free trial
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Creating Account...' : 'Start Free Trial'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
          Login
        </Link>
      </p>
    </div>
  )
}