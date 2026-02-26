'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { X, Tag, User } from 'lucide-react';

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

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer (LEFT) */}
      <aside
        className={[
          'fixed top-0 left-0 z-[9999] h-dvh w-72',
          'bg-zinc-950 text-white shadow-2xl',
          'transform transition-transform duration-200 will-change-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Menu
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-900 transition text-blue-500"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-3">
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href="/pricing"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-zinc-900 transition"
              >
                <Tag size={18} className="text-blue-500" />
                <span className="font-semibold">Pricing</span>
              </Link>
            </li>

            <li>
              <Link
                href="/about"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-zinc-900 transition"
              >
                <User size={18} className="text-blue-500" />
                <span className="font-semibold">About Me</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}