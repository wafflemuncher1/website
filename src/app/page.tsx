import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-[80vh] justify-center px-6">
      {/* Hero Section */}
      <section className="max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
          GLOSS<br />
          <span className="text-blue-600">WORKS</span><br />
          KY
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl max-w-md mb-8">
          The logical choice for premium mobile detailing. Serving Mt. Washington and the Louisville area.
        </p>

        <div className="flex gap-4">
          <a 
            href="sms:5025555555" 
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition"
          >
            Text Quote
          </a>
          <Link 
            href="/about" 
            className="bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition text-center"
          >
            About
          </Link>
        </div>
      </section>

      {/* Quick Status / Trust Bar */}
      <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-900 pt-10">
        <div>
          <p className="text-blue-500 font-bold uppercase text-xs tracking-widest">Service</p>
          <p className="text-zinc-300">100% Mobile</p>
        </div>
        <div>
          <p className="text-blue-500 font-bold uppercase text-xs tracking-widest">Region</p>
          <p className="text-zinc-300">Louisville, KY</p>
        </div>
      </div>
    </div>
  )
}