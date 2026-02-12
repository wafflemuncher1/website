import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-y-auto">
      
      {/* YOUR STANDARD HEADER */}
      <header className="p-10 flex justify-center">
         <h1 className="text-5xl font-black italic tracking-tighter">
          GLOSS<span className="text-blue-600">WORKS</span>
        </h1>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col items-center justify-center p-20 text-center">
        <h2 className="text-3xl font-bold mb-4 uppercase tracking-tighter">
          Elite Mobile Detailing
        </h2>
        <p className="text-zinc-400 max-w-md">
          Mt. Washington's premier choice for showroom-quality results.
        </p>
      </main>

      {/* YOUR STANDARD FOOTER */}
      <Footer />

    </div>
  );
}