export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative py-20 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-stone-200 rounded-full mx-auto mb-6 animate-pulse" />
            <div className="h-16 w-full bg-stone-200 rounded-lg mb-6 animate-pulse" />
            <div className="h-8 w-3/4 bg-stone-200 rounded-lg mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
