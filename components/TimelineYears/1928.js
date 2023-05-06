import React from 'react';

export default function Section1928({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1928" className="milestone-section">
            <h3><span className={`${selectedYear === 1928 ? 'selectedYear' : 'year'}`}>1928 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
