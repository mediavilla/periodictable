import React from 'react';

export default function Section1926({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1926" className="milestone-section">
            <h3><span className={`${selectedYear === 1926 ? 'selectedYear' : 'year'}`}>1926 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
