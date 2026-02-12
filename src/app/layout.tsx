import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white antialiased">
        <div className="flex flex-col min-h-screen">
          
          {/* MODERN DARK HEADER */}
          <header className="border-b border-zinc-900 bg-black py-6 px-6 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">
                GLOSS<span className="text-blue-600">WORKS</span>
              </h1>
              <a href="sms:5025555555" className="text-xs font-bold text-blue-500 border border-blue-500/30 px-4 py-2 rounded-full hover:bg-blue-500 hover:text-white transition-all">
                GET A QUOTE
              </a>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-grow w-full max-w-6xl mx-auto">
            {children}
          </main>

          {/* FOOTER */}
          <footer className="border-t border-zinc-900 py-10 bg-black text-center">
            <p className="text-zinc-600 text-sm font-bold italic uppercase tracking-widest">
              © 2026 GLOSSWORKS KY • MT. WASHINGTON
            </p>
          </footer>

        </div>
      </body>
    </html>
  );
}