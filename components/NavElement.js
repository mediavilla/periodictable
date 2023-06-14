import React from 'react';
import navElementStyles from '../styles/navElement.module.css';

export default function NavElement() {
    return (
        <div className={navElementStyles.navButtonsContainer}>
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavTop}`}>Top</button >
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavRight}`}>Right</button >
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavBottom}`}>Bottom</button>
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavLeft}`}>Left</button>
        </div>
    );
}

