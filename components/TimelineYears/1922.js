import React from 'react';

export default function Section1922({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1922" className="milestone-section">
            <h3><span className={`${selectedYear === 1922 ? 'selectedYear' : 'year'}`}>1922 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
