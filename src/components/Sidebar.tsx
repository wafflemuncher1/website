'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // Better looking icons than text ☰

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* 1. THE TOGGLE BUTTON (Placed in your header area) */}
      <button 
        className="fixed top-6 right-6 z-[70] p-2 text-blue-500" 
        onClick={toggleSidebar}
      >
        <Menu size={28} />
      </button>
      
      {/* 2. THE SEMI-TRANSPARENT OVERLAY (Dims the screen when menu is open) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* 3. THE SIDEBAR PANEL (Slides from the right) */}
      <nav className={`fixed top-0 right-0 h-full w-[280px] bg-zinc-950 z-[90] border-l border-zinc-900 transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Close Button Inside Sidebar */}
        <div className="flex justify-end p-6 border-b border-zinc-900">
          <button className="text-zinc-400" onClick={toggleSidebar}>
            <X size={28} />
          </button>
        </div>
        
        <ul className="flex flex-col p-8 gap-y-6">
          <li>
            <Link href="/" className="text-xl font-bold italic tracking-tighter" onClick={() => setIsOpen(false)}>
              HOME
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              ABOUT ME
            </Link>
          </li>
          <li>
            <Link href="/gallery" className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              GALLERY
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              SERVICES
            </Link>
          </li>
          <li>
            <Link href="/reviews" className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              REVIEWS
            </Link>
          </li>
          <li>
            <Link href="/faq" className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-xl font-bold italic tracking-tighter text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              CONTACT US
            </Link>
          </li>
        </ul>

        {/* Action Button at Bottom of Sidebar */}
        <div className="px-8 mt-4">
          <a href="sms:5025555555" className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-black italic">
            BOOK NOW
          </a>
        </div>
      </nav>
    </>
  );
}