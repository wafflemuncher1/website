'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';

type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  const [expanded, setExpanded] = useState(false);

  // Reset expansion whenever the drawer closes
  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const widthClass = expanded ? 'w-[85vw] max-w-sm' : 'w-16';

  return (
    <>
      {/* Backdrop (only when expanded so the page remains usable in mini mode) */}
      <div
        className={[
          'fixed inset-0 z-[60] bg-black/70 transition-opacity duration-200',
          open && expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={[
          'fixed top-0 right-0 z-[70] h-dvh',
          widthClass,
          'bg-zinc-950 text-white shadow-2xl',
          'transform transition-[transform,width] duration-200 will-change-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal={expanded ? 'true' : 'false'}
        aria-label="Sidebar menu"
      >
        {/* Top row */}
        <div className="flex items-center justify-end gap-2 p-3 border-b border-zinc-800">
          {/* Expand/collapse */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-2 rounded-lg hover:bg-zinc-900 transition text-blue-500"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={expanded}
          >
            <ChevronLeft size={20} className={expanded ? '' : 'rotate-180'} />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-900 transition text-blue-500"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content: only visible when expanded */}
        <div className={expanded ? 'block' : 'hidden'}>
          <div className="p-4">
            <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-sm text-zinc-300">Sidebar content goes here.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}