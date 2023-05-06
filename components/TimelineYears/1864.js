import React from 'react';

export default function Section1864({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1864" className="milestone-section">
            <h3><span className={`${selectedYear === 1864 ? 'selectedYear' : 'year'}`}>1864 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
