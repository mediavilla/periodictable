import React from 'react';

export default function Section1789({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1789" className="milestone-section">
            <h3><span className={`${selectedYear === 1789 ? 'selectedYear' : 'year'}`}>1789 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
