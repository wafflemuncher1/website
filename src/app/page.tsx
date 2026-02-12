export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      
      {/* 1. BRAND HEADER */}
      <div className="mb-4">
        <span className="text-blue-600 font-bold tracking-[0.5em] uppercase text-sm">
          Mount Washington • KY
        </span>
      </div>

      {/* 2. THE BIG NAME */}
      <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-8">
        GLOSS<span className="text-blue-600">WORKS</span>
      </h1>

      {/* 3. THE VALUE PROP */}
      <p className="max-w-md text-zinc-400 text-lg md:text-xl mb-12 leading-tight">
        High-performance mobile detailing. 
        We bring the showroom to your driveway.
      </p>

      {/* 4. THE ACTION (The only thing that matters) */}
      <div className="flex flex-col w-full max-w-xs gap-4">
        <a 
          href="sms:5025555555" 
          className="bg-white text-black py-5 rounded-full font-black text-xl hover:scale-105 transition-transform"
        >
          TEXT FOR QUOTE
        </a>
        <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold">
          Serving the 502 region
        </p>
      </div>

    </main>
  )
}