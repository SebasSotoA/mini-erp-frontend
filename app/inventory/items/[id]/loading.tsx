export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-2/3 bg-camouflage-green-100 rounded" />
      <div className="flex gap-3">
        <div className="h-10 w-40 bg-camouflage-green-100 rounded" />
        <div className="h-10 w-40 bg-camouflage-green-100 rounded" />
        <div className="h-10 w-40 bg-camouflage-green-100 rounded" />
        <div className="h-10 w-32 bg-camouflage-green-100 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="h-6 w-48 bg-camouflage-green-100 rounded" />
          <div className="h-32 w-full bg-camouflage-green-50 rounded" />
          <div className="h-32 w-full bg-camouflage-green-50 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-64 w-full bg-camouflage-green-50 rounded" />
          <div className="h-28 w-full bg-camouflage-green-50 rounded" />
        </div>
      </div>
    </div>
  )
}
