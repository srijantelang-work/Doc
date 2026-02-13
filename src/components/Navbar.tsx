'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/documents', label: 'Documents' },
    { href: '/status', label: 'Status' },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-logo">
                    <span className="navbar-logo-icon">◆</span>
                    KnowledgeBase
                </Link>
                <ul className="navbar-links">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
