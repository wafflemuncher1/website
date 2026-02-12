import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      
      {/* MAIN CONTENT: Just the name */}
      <main className="flex-grow flex items-center justify-center">
        <h1 className="text-[15vw] font-black tracking-tighter leading-none italic">
          GLOSS<span className="text-blue-600">WORKS</span>
        </h1>
      </main>

      {/* FOOTER: At the very bottom */}
      <Footer />

    </div>
  )
}