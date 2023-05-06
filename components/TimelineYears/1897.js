import React from 'react';

export default function Section1897({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1897" className="milestone-section">
            <h3><span className={`${selectedYear === 1897 ? 'selectedYear' : 'year'}`}>1897 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
