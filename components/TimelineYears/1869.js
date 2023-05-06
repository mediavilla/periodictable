import React from 'react';

export default function Section1869({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1869" className="milestone-section">
            <h3><span className={`${selectedYear === 1869 ? 'selectedYear' : 'year'}`}>1869 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
