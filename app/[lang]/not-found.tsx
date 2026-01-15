export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-coral hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
