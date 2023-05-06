import React from 'react';

export default function Section1932({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1932" className="milestone-section">
            <h3><span className={`${selectedYear === 1932 ? 'selectedYear' : 'year'}`}>1932 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
