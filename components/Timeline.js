import React from 'react';
import styles from '../styles/timeline.module.css';

export default function Timeline({ yearsData, onYearClick }) {

    return (
        <div className={styles.timeline}>
            {yearsData.map(({ year }) => (
                <button key={year} onClick={() => onYearClick(year)}>
                    {year}
                </button>
            ))}
        </div>
    );
}
