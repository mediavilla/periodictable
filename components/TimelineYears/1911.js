import React from 'react';

export default function Section1911({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1911" className="milestone-section">
            <h3><span className={`${selectedYear === 1911 ? 'selectedYear' : 'year'}`}>1911 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
