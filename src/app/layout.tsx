'use client';

import Link from 'next/link';
import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={toggleSidebar}>
          ✕
        </button>
        
        <ul className="sidebar-menu">
          <li>
            <Link href="/" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" onClick={() => setIsOpen(false)}>
              About Me
            </Link>
          </li>
          <li>
            <Link href="/gallery" onClick={() => setIsOpen(false)}>
              Gallery
            </Link>
          </li>
          <li>
            <Link href="/services" onClick={() => setIsOpen(false)}>
              Services
            </Link>
          </li>
          <li>
            <Link href="/reviews" onClick={() => setIsOpen(false)}>
              Reviews
            </Link>
          </li>
          <li>
            <Link href="/faq" onClick={() => setIsOpen(false)}>
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" onClick={() => setIsOpen(false)}>
              Contact Us
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}