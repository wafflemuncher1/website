import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'GlossWorks KY | Mobile Detailing',
  description: 'Professional mobile car detailing services',
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
          
          <header className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-6 py-5">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center">
              <h1 className="font-black italic text-2xl tracking-tighter">
                GLOSS<span className="text-blue-600">WORKS</span>
              </h1>
              <Sidebar />
            </div>
          </header>

          <main className="flex-grow pt-24 px-6 max-w-screen-xl mx-auto w-full">
            {children}
          </main>

          <footer className="border-t border-zinc-900 py-8 px-6 bg-zinc-950">
            <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-zinc-500 text-sm italic font-bold">
                © 2026 GLOSSWORKS KY
              </p>
              <div className="flex gap-6 text-zinc-400 text-sm">
                <span>Mt. Washington, KY</span>
                <a href="sms:5025555555" className="hover:text-blue-500 transition">Text for Quote</a>
              </div>
            </div>
          </footer>

        </div>
      </body>
    </html>
  );
}