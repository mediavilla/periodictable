import React from 'react';

export default function Section1969({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1969" className="milestone-section">
            <h3><span className={`${selectedYear === 1969 ? 'selectedYear' : 'year'}`}>1969 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
