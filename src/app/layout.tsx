import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GlossWorks KY | Mobile Detailing',
  description: 'Premium mobile detailing services in Mt. Washington',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <div className="flex flex-col min-h-screen">
          
          {/* SIMPLE STATIC HEADER */}
          <header className="w-full border-b border-zinc-900 px-6 py-6 bg-black">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center">
              <h1 className="font-black italic text-3xl tracking-tighter">
                GLOSS<span className="text-blue-600">WORKS</span>
              </h1>
              {/* Quick Contact Link instead of a menu */}
              <a href="sms:5025555555" className="text-sm font-bold text-zinc-400 hover:text-blue-500 transition">
                TEXT FOR QUOTE
              </a>
            </div>
          </header>

          {/* CONTENT AREA */}
          <main className="flex-grow">
            {children}
          </main>

          {/* CLEAN FOOTER */}
          <footer className="border-t border-zinc-900 py-10 px-6 bg-black">
            <div className="max-w-screen-xl mx-auto text-center">
              <p className="text-zinc-500 text-sm font-bold italic mb-2">
                © 2026 GLOSSWORKS KY
              </p>
              <p className="text-zinc-600 text-xs">Mt. Washington, Kentucky</p>
            </div>
          </footer>

        </div>
      </body>
    </html>
  );
}