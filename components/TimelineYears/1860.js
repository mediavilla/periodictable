import React from 'react';

export default function Section1860({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1860" className="milestone-section">
            <h3><span className={`${selectedYear === 1860 ? 'selectedYear' : 'year'}`}>1860 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
