'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { X } from 'lucide-react';

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
    'block w-full rounded-lg px-4 py-3 text-lg font-semibold text-black ' +
    'hover:bg-zinc-100 active:bg-zinc-200 transition';

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

      {/* Drawer */}
      <aside
        className={[
          'fixed top-0 left-0 z-[9999] h-dvh w-80 max-w-[85vw]',
          'bg-white', // full white top-to-bottom
          'transform transition-transform duration-200 will-change-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 transition text-black"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Links */}
        <nav className="px-3">
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/pricing" onClick={onClose} className={linkClass}>
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={onClose} className={linkClass}>
                About Me
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}