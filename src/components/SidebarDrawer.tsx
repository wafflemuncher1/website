'use client';

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
        <div className="flex items-center justify-end p-3 border-b border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-900 transition text-blue-500"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="h-32 rounded-xl border border-zinc-800 bg-black/40" />
        </div>
      </aside>
    </>
  );
}