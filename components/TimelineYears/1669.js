import React from 'react';

export default function Section1669({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1669" className="milestone-section">
            <h3><span className={`${selectedYear === 1669 ? 'selectedYear' : 'year'}`}>1669 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
