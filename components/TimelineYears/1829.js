import React from 'react';

export default function Section1829({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1829" className="milestone-section">
            <h3><span className={`${selectedYear === 1829 ? 'selectedYear' : 'year'}`}>1829 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
