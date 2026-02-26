'use client';

import { Menu } from 'lucide-react';

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-[9999] bg-black/80 backdrop-blur-md border-b border-zinc-900 px-6 py-5">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* LEFT: Sidebar Trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-zinc-900 transition text-blue-500"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* RIGHT: Company Name */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-black text-xs italic">GW</span>
          </div>

          <span className="font-black tracking-tighter text-xl italic text-right">
            GLOSS<span className="text-blue-600">WORKS</span>
          </span>
        </div>
      </div>
    </header>
  );
}