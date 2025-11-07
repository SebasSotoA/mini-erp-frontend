import Image from "next/image"

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-camouflage-green-50">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Logo */}
        <div className="relative h-24 w-24">
          <Image
            src="/favicon.ico"
            alt="Inventa Logo"
            width={96}
            height={96}
            className="animate-pulse object-contain"
            priority
            unoptimized
          />
        </div>
        {/* Spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-camouflage-green-300 border-t-camouflage-green-600"></div>
        {/* Texto de carga */}
        <p className="text-sm font-medium text-camouflage-green-700">Cargando...</p>
      </div>
    </div>
  )
}