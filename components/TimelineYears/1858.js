import React from 'react';

export default function Section1858({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1858" className="milestone-section">
            <h3><span className={`${selectedYear === 1858 ? 'selectedYear' : 'year'}`}>1858 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
