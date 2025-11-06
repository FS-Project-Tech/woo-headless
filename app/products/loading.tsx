export default function Loading() {
  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-1 space-y-3">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="lg:col-span-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-gray-200 bg-white" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


