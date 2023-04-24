import React from 'react';
import styles from '../styles/timeline.module.css';

export default function Timeline({ yearsData, onYearClick }) {
    const handleClick = (year, event) => {
        event.preventDefault();
        onYearClick(year);
    }

    ///    const reversedYearsData = yearsData.slice().reverse();

    return (
        <div className={styles.timeline}>
            <ul className={styles.timelineYears}>
                {yearsData.map(({ year }) => (
                    <li key={year}>
                        <a href="#" onClick={(event) => handleClick(year, event)}>
                            {year}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
