'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { X, Tag, User, Home } from 'lucide-react';

type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const linkClass =
    'flex items-center gap-3 rounded-xl px-3 py-3 transition ' +
    'text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200';

  const iconClass = 'text-blue-600';

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer (LEFT) */}
      <aside
        className={[
          'fixed top-0 left-0 z-[9999] h-dvh w-80 max-w-[85vw]',
          'bg-white text-zinc-900 shadow-2xl',
          'transform transition-transform duration-200 will-change-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs italic">GW</span>
            </div>
            <div className="leading-tight">
              <div className="font-black tracking-tighter italic">
                GLOSS<span className="text-blue-600">WORKS</span>
              </div>
              <div className="text-xs text-zinc-500">Menu</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 transition text-zinc-700"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <nav className="p-3">
          <ul className="flex flex-col gap-1">
            <li>
              <Link href="/" onClick={onClose} className={linkClass}>
                <Home size={18} className={iconClass} />
                <span className="font-semibold">Home</span>
              </Link>
            </li>

            <li>
              <Link href="/pricing" onClick={onClose} className={linkClass}>
                <Tag size={18} className={iconClass} />
                <span className="font-semibold">Pricing</span>
              </Link>
            </li>

            <li>
              <Link href="/about" onClick={onClose} className={linkClass}>
                <User size={18} className={iconClass} />
                <span className="font-semibold">About Me</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Bottom area (optional) */}
        <div className="mt-auto px-4 py-4 border-t border-zinc-200 text-xs text-zinc-500">
          © {new Date().getFullYear()} GlossWorks
        </div>
      </aside>
    </>
  );
}