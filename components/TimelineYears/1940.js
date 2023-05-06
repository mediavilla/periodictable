import React from 'react';

export default function Section1940({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1940" className="milestone-section">
            <h3><span className={`${selectedYear === 1940 ? 'selectedYear' : 'year'}`}>1940 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
