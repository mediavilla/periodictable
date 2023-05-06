import React from 'react';

export default function Section1913({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1913" className="milestone-section">
            <h3><span className={`${selectedYear === 1913 ? 'selectedYear' : 'year'}`}>1913 /</span> {description}</h3>
            {/* Additional content */}
        </section >
    );
}
