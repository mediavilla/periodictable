import React from 'react';

export default function Section1803({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1803" className="milestone-section">
            <h3><span className={`${selectedYear === 1803 ? 'selectedYear' : 'year'}`}>1803 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
