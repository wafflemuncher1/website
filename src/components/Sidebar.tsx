'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Function to handle clicking a link (closes the menu)
  const handleLinkClick = () => setIsOpen(false);

  return (
    <>
      {/* 1. THE TRIGGER BUTTON (Top Right) */}
      <button 
        className="fixed top-5 right-5 z-[100] bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-blue-500 font-bold shadow-2xl active:scale-95 transition-transform" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '☰'}
      </button>
      
      {/* 2. THE OVERLAY (Dims the rest of the screen) */}
      <div 
        className={`fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. THE SIDEBAR PANEL (Slides from Right) */}
      <nav className={`fixed top-0 right-0 h-full w-[280px] bg-black z-[90] border-l border-zinc-900 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-8 border-b border-zinc-900 mb-6">
          <span className="font-black italic text-xl tracking-tighter">
            GLOSS<span className="text-blue-600">WORKS</span>
          </span>
        </div>
        
        {/* Navigation Links */}
        <ul className="flex flex-col px-8 gap-y-6">
          <li>
            <Link href="/" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter hover:text-blue-500 transition-colors">
              HOME
            </Link>
          </li>
          <li>
            <Link href="/about" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white transition-colors">
              ABOUT ME
            </Link>
          </li>
          <li>
            <Link href="/gallery" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white transition-colors">
              GALLERY
            </Link>
          </li>
          <li>
            <Link href="/services" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white transition-colors">
              SERVICES
            </Link>
          </li>
          <li>
            <Link href="/reviews" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white transition-colors">
              REVIEWS
            </Link>
          </li>
          <li>
            <Link href="/faq" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white transition-colors">
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" onClick={handleLinkClick} className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white transition-colors">
              CONTACT US
            </Link>
          </li>
        </ul>

        {/* Call to Action */}
        <div className="px-8 mt-10">
          <a 
            href="sms:5025555555" 
            className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-black italic shadow-lg shadow-blue-900/30 active:bg-blue-700"
          >
            BOOK NOW
          </a>
        </div>
      </nav>
    </>
  );
}