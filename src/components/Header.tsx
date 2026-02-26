'use client';

import { Menu } from 'lucide-react';

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900 px-6 py-6">
      <div className="flex justify-between items-center max-w-screen-xl mx-auto">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center mr-2">
            <span className="text-white font-black text-xs italic">GW</span>
          </div>

          <span className="font-black tracking-tighter text-xl italic">
            GLOSS<span className="text-blue-600">WORKS</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 hover:bg-zinc-900 rounded-lg transition text-blue-500"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
}