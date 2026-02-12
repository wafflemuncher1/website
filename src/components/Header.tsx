'use client'
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react'; 

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* --- FIXED HEADER --- */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-6 py-6">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          
          {/* LOGO (Far Left) */}
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center mr-2 text-white font-black text-xs italic">
              GW
            </div>
            <span className="font-black tracking-tighter text-2xl italic">
              GLOSS<span className="text-blue-600">WORKS</span>
            </span>
          </Link>

          {/* SIDEBAR TRIGGER (Far Right) */}
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 text-blue-500 hover:text-white transition-colors"
          >
            <Menu size={28} />
          </button>
        </div>
      </header>

      {/* --- RIGHT-SIDE SIDEBAR --- */}
      {/* Background Overlay (Dimmer) */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[55] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* Sidebar Panel (Slides from Right) */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-zinc-950 z-[60] border-l border-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-900">
          <span className="font-bold text-xs uppercase tracking-widest text-zinc-500">Menu</span>
          <button onClick={closeMenu} className="text-zinc-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col p-6 gap-y-6">
          <Link href="/" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">HOME</Link>
          <Link href="/about" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">ABOUT ME</Link>
          <Link href="/services" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">SERVICES</Link>
          <Link href="/gallery" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">GALLERY</Link>
          <Link href="/reviews" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">REVIEWS</Link>
          <Link href="/faq" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">FAQ</Link>
          <Link href="/contact" onClick={closeMenu} className="text-xl font-bold italic hover:text-blue-500 transition">CONTACT US</Link>
          
          <a 
            href="sms:5025555555" 
            className="mt-4 bg-blue-600 text-white text-center py-4 rounded-xl font-black italic shadow-lg shadow-blue-900/20"
          >
            BOOK NOW
          </a>
        </nav>
      </div>
    </>
  );
}