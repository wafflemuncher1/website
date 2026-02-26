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
          'fixed inset-0 z-[60] bg-black/60 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={[
          'fixed top-0 right-0 z-[70] h-dvh w-[85vw] max-w-sm',
          'bg-black', // removed border-l to eliminate the visible 1px line
          'transform transition-transform duration-200 will-change-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar menu"
      >
        <div className="flex items-center justify-end p-4 border-b border-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-900 transition text-blue-500"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-4">{/* empty for now */}</div>
      </aside>
    </>
  );
}