import React from 'react';

export default function Section1894({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1894" className="milestone-section">
            <h3><span className={`${selectedYear === 1894 ? 'selectedYear' : 'year'}`}>1894 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
