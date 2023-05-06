import React from 'react';

export default function Section1924({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1924" className="milestone-section">
            <h3><span className={`${selectedYear === 1924 ? 'selectedYear' : 'year'}`}>1924 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
