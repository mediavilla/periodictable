import React from 'react';
import Link from 'next/link'
import navTopStyles from '../styles/navTop.module.css';

export default function NavTop() {
    return (
        <ul className={navTopStyles.navTop}>
            <li><Link href="/">Designs</Link></li>
            <li><Link href="/timeline">Timeline</Link></li>
            <li><Link href="/elements">Elements</Link></li>
        </ul>
    );
}
