import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import navElementStyles from '../styles/navElement.module.css';

export default function NavElement() {
    const { currentElement, setCurrentElement, tableType, setTableType } = useContext(TableContext);
    return (
        <div className={navElementStyles.navButtonsContainer}>
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavTop}`}>Top</button >
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavRight}`}>Right</button >
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavBottom}`}>Bottom</button>
            <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavLeft}`}>Left</button>
        </div>
    );
}

