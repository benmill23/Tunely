export default function ArtistLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        {children}
      </div>
    )
  }