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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100000] bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel (above header) */}
      <aside
        className="fixed top-0 left-0 z-[100002] h-dvh w-72 bg-white text-black shadow-2xl"
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-zinc-100 transition text-black"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="px-3">
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href="/pricing"
                onClick={onClose}
                className="block w-full rounded-md px-4 py-3 text-base font-semibold hover:bg-zinc-100"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={onClose}
                className="block w-full rounded-md px-4 py-3 text-base font-semibold hover:bg-zinc-100"
              >
                About Me
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}