import React from 'react';
import Link from 'next/link'
import Image from 'next/image'
import footerStyles from '../styles/footer.module.css';

export default function Footer() { 

    return (

        <footer className={footerStyles.footer}>
            <div className={footerStyles.footerContainer}>
                <div><Link href="/" className={footerStyles.bottomLink}>Design</Link></div >
                <div><Link href="/about" className={footerStyles.bottomLink}>Info / About</Link></div>
                <div><Link href="https://x.com/Tablelements" className={footerStyles.bottomLink}>Twitter [ X ]</Link></div>
                <div><Link href="/timeline" className={footerStyles.bottomLink}>Timeline</Link></div>
                <div><Link href="/sponsor" className={footerStyles.bottomLink}>Sponsor</Link></div>
                <div>&nbsp;</div>
                <div><Link href="/elements" className={footerStyles.bottomLink}>Elements</Link></div>
                <div><Link href="/donate" className={footerStyles.bottomLink}>Donate</Link></div>
                <div>&nbsp;</div>
                <div>&nbsp;</div>
                <div><Link href="#" className={footerStyles.bottomLink}>Feedback</Link></div>
                <div>&nbsp;</div>
                <div>&nbsp;</div>
                <div><Link href="/contact" className={footerStyles.bottomLink}>Contact</Link></div>
                <div>&nbsp;</div>
            </div>
            <div className={footerStyles.footerLogo}><Image src="./images/logo.svg" height="200" width="200" alt="logo" /></div>
        </footer >
    );
}
