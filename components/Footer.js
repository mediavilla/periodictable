import React from 'react';
import Link from 'next/link'
import footerStyles from '../styles/footer.module.css';

export default function Footer() {

    return (

        <footer className={footerStyles.footer}>
            <div className={footerStyles.footerContainer}>
                <div className={footerStyles.footerSectionTitle}> Section 1 title</div >
                <div className={footerStyles.footerSectionTitle}> Section 2 title</div>
                <div><Link href="#" className={footerStyles.bottomLink}>Social Media Icons</Link></div >
                <div><Link href="#" className={footerStyles.bottomLink}>Item 2</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Item 3</Link></div>
                <div>&nbsp;</div>
                <div><Link href="#" className={footerStyles.bottomLink}>Item 5</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Item 6</Link></div>
                <div>&nbsp;</div>
                <div><Link href="#" className={footerStyles.bottomLink}>License</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Cookie Policy</Link></div>
                <div><Link href="#" className={footerStyles.bottomLink}>Terms and Conditions</Link></div>
            </div>
        </footer >
    );
}
