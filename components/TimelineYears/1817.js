import React from 'react';

export default function Section1817({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1817" className="milestone-section">
            <h3><span className={`${selectedYear === 1817 ? 'selectedYear' : 'year'}`}>1817 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
