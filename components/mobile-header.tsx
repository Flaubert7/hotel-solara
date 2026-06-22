import Image from 'next/image'

export default function MobileHeader() {
  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-40">
      <Image src="/logo.png" alt="Hotel Solara" width={56} height={56} className="object-contain" />
    </header>
  )
}
