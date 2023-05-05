import React from 'react';
import elementStyles from '../styles/periodicTable.module.css';

export default function ElementCard({ element, getCategoryClassName }) {
    console.log('Element:', element); // Add this line to log the element data
    console.log('Category:', element.category); // Add this line to log the element category
    console.log('Generated Class:', getCategoryClassName(element.category)); // Add this line to log the generated class name
    return (
        <div className={`${elementStyles.element} ${getCategoryClassName(element.category)} ${elementStyles.elementCardBigContainer}`}>
            <div className={`${elementStyles.elementCardBig} `}>
                <div className={elementStyles.atomicNumber}>{element.number}</div>
                <div className={elementStyles.symbol}>{element.symbol}</div>
                <div className={elementStyles.name}>{element.name}</div>
                <div className={elementStyles.econfig}>{element.econfig_shorthand}</div>
            </div>
        </div>
    );
};
