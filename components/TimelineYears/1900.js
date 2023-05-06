import React from 'react';

export default function Section1900({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1900" className="milestone-section">
            <h3><span className={`${selectedYear === 1900 ? 'selectedYear' : 'year'}`}>1900 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
