import React from 'react';

export default function Section1871({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1871" className="milestone-section">
            <h3><span className={`${selectedYear === 1871 ? 'selectedYear' : 'year'}`}>1871 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
