import React from 'react';
import Link from 'next/link'
import navTopStyles from '../styles/navTop.module.css';

export default function NavTop() {

    return (
        <nav className={navTopStyles.navTop}>
            <ul>
                <li><Link href="#">Designs</Link></li>
                <li><Link href="#">Timeline</Link></li>
                <li><Link href="#">Elements</Link></li>
            </ul>
        </nav >
    );
}
