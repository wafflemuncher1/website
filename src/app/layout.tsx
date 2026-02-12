import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'GlossWorks KY | Mobile Detailing',
  description: 'Professional mobile car detailing services in Mt. Washington',
=======
  title: 'Mobile Detailing',
  description: 'Professional mobile car detailing services',
>>>>>>> 07db4cc1d75b3dc001d56e76bd38bb758a322361
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
<<<<<<< HEAD
      {/* We add bg-black here to ensure the whole screen is dark */}
      <body className="bg-black text-white antialiased">
        <div className="flex flex-col min-h-screen">
          
          {/* HEADER: Deep black, sticky, and slim */}
          <header className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-6 py-5">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center">
              <h1 className="font-black italic text-2xl tracking-tighter">
                GLOSS<span className="text-blue-600">WORKS</span>
              </h1>
              <Sidebar />
            </div>
          </header>

          {/* MAIN CONTENT: Padded top so it doesn't hide under the header */}
          <main className="flex-grow pt-24 px-6 max-w-screen-xl mx-auto w-full">
            {children}
          </main>

          {/* FOOTER: Pinned to the bottom of the flex container */}
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

=======
      <body>
        <div className="layout-container">
          <header className="header">
            <div className="header-content">
              <h1>Mobile Detailing</h1>
              <Sidebar />
            </div>
          </header>
          <main className="main-content">
            {children}
          </main>
>>>>>>> 07db4cc1d75b3dc001d56e76bd38bb758a322361
        </div>
      </body>
    </html>
  );
}