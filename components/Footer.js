import React from 'react';
import Link from 'next/link'
import Image from 'next/image'
import footerStyles from '../styles/footer.module.css';

export default function Footer() {

    return (

        <footer className={footerStyles.footer}>
            <div className={footerStyles.footerContainer}>
                <div><Link href="#" className={footerStyles.bottomLink}>Design</Link></div >
                <div><Link href="#" className={footerStyles.bottomLink}>Info / About</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Apple Store</Link></div >
                <div><Link href="#" className={footerStyles.bottomLink}>Timeline</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Sponsor</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Play Store</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Elements</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Donate</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Github</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Feedback</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Contact</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Twitter [ X ]</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>License</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Cookie Policy</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Terms and Conditions</Link></div>
            </div>
            <div className={footerStyles.footerLogo}><Image src="./images/logo.svg" height="200" width="200" alt="logo" /></div>
        </footer >
    );
}
