import React from 'react';
import Link from 'next/link'
import footerStyles from '../styles/footer.module.css';

export default function Footer() {

    return (
        <footer className={footerStyles.footerContainer}>
            <div className={footerStyles.footer}>
                <div className={footerStyles.footerLinks}>
                    <ul className={footerStyles.footerList}>
                        <li><Link href="#">Designs</Link></li>
                        <li><Link href="#">Timeline</Link></li>
                        <li><Link href="#">Elements</Link></li>
                    </ul>
                </div>
                <div className={footerStyles.footerLinks}>
                    <ul className={footerStyles.footerList}>
                        <li><Link href="#">About</Link></li>
                        <li><Link href="#">Nerd stuff</Link></li>
                        <li><Link href="#">Download app</Link></li>
                        <li><Link href="#">Shop</Link></li>
                        <li><Link href="#">Lab</Link></li>
                        <li><Link href="#">External resources</Link></li>
                    </ul>
                </div>
                <div className={footerStyles.footerLinks}>
                    <ul className={footerStyles.footerList}>
                        <li><Link href="#">Cookie Policy</Link></li>
                        <li><Link href="#">Terms and conditions</Link></li>
                        <li><Link href="#">License</Link></li>
                    </ul>
                </div>
                <div className={footerStyles.footerLinks}>
                    <ul className={footerStyles.footerList}>
                        <li><Link href="#">Social icons</Link></li>
                    </ul>
                </div>
            </div>
        </footer >
    );
}
