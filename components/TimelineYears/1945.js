import React from 'react';

export default function Section1945({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1945" className="milestone-section">
            <h3><span className={`${selectedYear === 1945 ? 'selectedYear' : 'year'}`}>1945 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
