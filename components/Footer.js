import React, { useState } from 'react';
import Link from 'next/link'
import footerStyles from '../styles/footer.module.css';

export default function Footer() {

    return (
        <footer className={footerStyles.footer}>
            <div id="content">
                <ul className={footerStyles.footerList}>

                    <li><Link href="#">About</Link></li>
                    <li><Link href="#">Nerds</Link></li>
                    <li><Link href="#">Download app</Link></li>
                    <li><Link href="#">Shop</Link></li>
                    <li><Link href="#">Lab</Link></li>
                    <li><Link href="#">External resources</Link></li>
                    <li><Link href="#">Cookie Policy</Link></li>
                    <li><Link href="#">Terms and conditions</Link></li>
                    <li><Link href="#">License</Link></li>
                    <li><Link href="#">Social icons</Link></li>

                </ul>
            </div>
        </footer>
    );
}
