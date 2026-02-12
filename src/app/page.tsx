import Footer from '@/components/Footer'

export default function Home() {
  return (
    // We use overflow-y-auto so the user can scroll down to that big footer
    <div className="flex flex-col min-h-screen bg-black overflow-y-auto">
      
      <main className="flex-grow flex items-center justify-center p-20">
        <h1 className="text-5xl font-black italic tracking-tighter">
          GLOSS<span className="text-blue-600">WORKS</span>
        </h1>
      </main>

      <Footer />

    </div>
  )
}