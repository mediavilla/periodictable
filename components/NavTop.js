import React from 'react';
import Link from 'next/link'
import navTopStyles from '../styles/navTop.module.css';

export default function NavTop() {
    return (
        <ul className={navTopStyles.navTop}>
            <li><Link href="/">DESIGNS</Link></li>
            <li><Link href="/timeline">TIMELINE</Link></li>
            <li><Link href="/elements">ELEMENTS</Link></li>
        </ul>
    );
}
