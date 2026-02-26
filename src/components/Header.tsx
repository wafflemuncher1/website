'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-[100001] bg-black/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4">
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

        {/* RIGHT: Clickable Logo (go home) */}
        <Link href="/" aria-label="Go to homepage" className="shrink-0">
          <Image
            src="/glossworks-logo.png"
            alt="GlossWorks"
            width={220}
            height={80}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>
    </header>
  );
}