import React from 'react';
import Link from 'next/link'
import footerStyles from '../styles/footer.module.css';

export default function Footer() {

    return (

        <footer className={footerStyles.footerContainer}>
            <div className={`${footerStyles.title} ${footerStyles.title2}`}> Section 2 title</div >
            <div className={footerStyles.icon}>Terms and Conditions</div>
            <div className={`${footerStyles.section} ${footerStyles.section1Item}`}> Item 1</div >
            <div className={`${footerStyles.section} ${footerStyles.section1Item}`}>Item 2</div>
            <div className={`${footerStyles.section} ${footerStyles.section1Item}`}>Item 3</div>
            <div className={`${footerStyles.section} ${footerStyles.section2Item}`}>Item 4</div>
            <div className={`${footerStyles.section} ${footerStyles.section2Item}`}>Item 5</div>
            <div className={`${footerStyles.section} ${footerStyles.section2Item}`}>Item 6</div>
            <div className={footerStyles.bottomLink}>License</div>
            <div className={footerStyles.bottomLink}>Cookie Policy</div>
            <div className={footerStyles.bottomLink}>Terms and Conditions</div>
            <div className={footerStyles.icon}>Terms and Conditions</div>
        </footer >
    );
}
