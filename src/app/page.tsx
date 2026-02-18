import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-y-auto">
      {/* MAIN CONTENT - Add top padding to account for fixed header */}
      <main className="flex-grow flex flex-col items-center justify-center p-20 text-center pt-32">
        <h2 className="text-3xl font-bold mb-4 uppercase tracking-tighter">
          
        </h2>
        <p className="text-zinc-400 max-w-md">
          code here
        </p>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}