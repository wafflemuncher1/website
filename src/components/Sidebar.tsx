'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className={styles.sidebarToggle} onClick={toggleSidebar}>
        ☰
      </button>
      
      <nav className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>  
        <button className={styles.sidebarClose} onClick={toggleSidebar}>
          ✕
        </button>
        
        <ul className={styles.sidebarMenu}>
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