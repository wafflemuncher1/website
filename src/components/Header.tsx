'use client'
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react'; 

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to close menu when a link is clicked
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* --- MAIN HEADER BAR --- */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-6 py-6">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          
          {/* LEFT: Logo Area */}
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center mr-2">
              <span className="text-white font-black text-xs italic">GW</span>
            </div>
            <span className="font-black tracking-tighter text-2xl italic">
              GLOSS<span className="text-blue-600">WORKS</span>
            </span>
          </Link>

          {/* RIGHT: Menu Trigger */}
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 text-blue-500 active:scale-90 transition-transform"
          >
            <Menu size={28} />
          </button>
        </div>
      </header>

      {/* --- SIDEBAR OVERLAY PANEL --- */}
      <div 
        className={`fixed inset-0 z-[60] bg-black transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button Header */}
        <div className="flex justify-end p-8">
          <button onClick={closeMenu} className="text-zinc-400 hover:text-white transition">
            <X size={35} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col items-center gap-6 mt-4">
          <Link href="/" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter">
            HOME
          </Link>
          <Link href="/about" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter text-zinc-400 hover:text-white">
            ABOUT ME
          </Link>
          <Link href="/services" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter text-zinc-400 hover:text-white">
            SERVICES
          </Link>
          <Link href="/gallery" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter text-zinc-400 hover:text-white">
            GALLERY
          </Link>
          <Link href="/reviews" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter text-zinc-400 hover:text-white">
            REVIEWS
          </Link>
          <Link href="/faq" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter text-zinc-400 hover:text-white">
            FAQ
          </Link>
          <Link href="/contact" onClick={closeMenu} className="text-2xl font-bold italic tracking-tighter text-zinc-400 hover:text-white">
            CONTACT US
          </Link>
          
          {/* Mobile Action Button */}
          <a 
            href="sms:5025555555" 
            className="mt-10 bg-blue-600 text-white px-12 py-4 rounded-full font-black italic tracking-tight shadow-lg shadow-blue-900/40"
          >
            BOOK NOW
          </a>
        </nav>
      </div>
    </>
  );
}