import React from 'react';

export default function Section2000({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="2000" className="milestone-section">
            <h3><span className={`${selectedYear === 2000 ? 'selectedYear' : 'year'}`}>2000 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
