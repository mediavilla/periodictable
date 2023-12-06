import React from 'react';
import Link from 'next/link'
import navTopStyles from '../styles/navTop.module.css';

export default function NavTop() {
    return (
        <ul className={navTopStyles.navTop}>
            <li><Link href="/">DESIGNS</Link></li>
            <li><Link className="timelineNav" href="/Timeline">TIMELINE</Link></li>
            <li><Link href="/Elements">ELEMENTS</Link></li>
        </ul>
    );
}
