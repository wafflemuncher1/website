import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      
      {/* This empty main tag pushes the footer down */}
      <main className="flex-grow">
        {/* Everything is removed from here */}
      </main>

      <Footer />

    </div>
  )
}