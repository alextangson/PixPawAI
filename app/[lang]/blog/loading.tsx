<<<<<<< HEAD
export default function HowToLoading() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Skeleton */}
      <div className="relative py-20 bg-gradient-to-br from-orange-50 via-cream to-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 rounded-full mx-auto mb-6 animate-pulse"></div>
            <div className="h-16 w-full bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
=======
export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative py-20 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-stone-200 rounded-full mx-auto mb-6 animate-pulse" />
            <div className="h-16 w-full bg-stone-200 rounded-lg mb-6 animate-pulse" />
            <div className="h-8 w-3/4 bg-stone-200 rounded-lg mx-auto animate-pulse" />
>>>>>>> origin/main
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Content Skeleton */}
=======
>>>>>>> origin/main
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
<<<<<<< HEAD
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-6 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
=======
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse"
              >
                <div className="h-48 bg-stone-200" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-24 bg-stone-200 rounded" />
                  <div className="h-6 w-full bg-stone-200 rounded" />
                  <div className="h-4 w-full bg-stone-200 rounded" />
                  <div className="h-4 w-3/4 bg-stone-200 rounded" />
>>>>>>> origin/main
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
