import React from 'react';
import styles from '../styles/timeline.module.css';

export default function Timeline({ yearsData, onYearClick, selectedYear }) {
    const handleClick = (year, event) => {
        event.preventDefault();
        onYearClick(year);
    };

    return (
        <div className={styles.timeline}>
            <ul className={styles.timelineYears}>
                {yearsData.map(({ year }) => (
                    <li key={year}>
                        <a
                            href={`#${year}`}
                            onClick={(event) => handleClick(year, event)}
                            className={year === selectedYear ? styles.selected : ''}
                        >
                            {year}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
