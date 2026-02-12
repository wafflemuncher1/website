import Footer from '@/components/Footer'

export default function Home() {
  return (
    // min-h-dvh (dynamic viewport height) is best for mobile browsers
    <div className="flex flex-col min-h-dvh bg-black overflow-hidden">
      
      {/* This empty space pushes the footer to the bottom of the phone screen */}
      <main className="flex-grow">
        {/* Keeping this empty as requested */}
      </main>

      <Footer />

    </div>
  )
}