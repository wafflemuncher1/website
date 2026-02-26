'use client'

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-zinc-950 border-l border-zinc-800 shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drawer content placeholder */}
        <nav aria-label="Sidebar navigation" className="flex-1 px-6 py-4" />
      </div>
    </>
  );
}
