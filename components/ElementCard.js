import React from 'react';

import tableStyles from '../styles/periodicTable.module.css';

export default function ElementCard({ element, getCategoryClassName }) {

    // console.log('Element:', element); // Add this line to log the element data
    // console.log('Category:', element.category); // Add this line to log the element category
    // console.log('Generated Class:', getCategoryClassName(element.category)); // Add this line to log the generated class name
    return (
        <div className={`${tableStyles.element} ${getCategoryClassName(element.category)} ${tableStyles.elementCardBigContainer}`}>
            <div className={`${tableStyles.elementCardBig} `}>
                <div className={tableStyles.atomicNumber}>{element.number}</div>
                <div className={tableStyles.symbol}>{element.symbol}</div>
                <div className={tableStyles.name}>{element.name}</div>
                <div className={tableStyles.econfig}>{element.econfig_shorthand}</div>
            </div>
        </div>
    );
};
