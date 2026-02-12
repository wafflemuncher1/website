'use client' // This tells Next.js this part is interactive

import { useState } from 'react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  return (
    <>
      {/* The Hamburger Button */}
      <button 
        onClick={toggle}
        className="fixed top-5 right-5 z-50 p-2 bg-blue-600 rounded-lg text-white font-bold"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* The Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full bg-black border-l border-zinc-800 transition-all duration-300 z-40 ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-10 flex flex-col gap-6">
          <h3 className="text-blue-500 text-xs tracking-widest uppercase font-bold">Navigation</h3>
          <a href="/" className="text-white text-lg">Home</a>
          <a href="/about" className="text-white text-lg">About Me</a>
          <a href="/pricing" className="text-white text-lg">Pricing</a>
          
          <hr className="border-zinc-800" />
          
          <h3 className="text-blue-500 text-xs tracking-widest uppercase font-bold">Service Area</h3>
          <p className="text-zinc-400 text-sm">Mount Washington<br/>Louisville<br/>Shepherdsville</p>
        </div>
      </div>
    </>
  )
}