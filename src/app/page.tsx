import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">🎵 Tunely</h1>
          <p className="text-xl mb-8">Live Music Requests Made Simple</p>
          <div className="space-x-4">
            <Link href="/login">
              <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
                Artist Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-400">
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}