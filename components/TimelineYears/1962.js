import React from 'react';
import Image from 'next/image';

export default function Section1962({ description, elements, getCategoryClassName, selectedYear }) {
    return (
        <section id="1962" className="milestone-section">
            <h3><span className={`${selectedYear === 1962 ? 'selectedYear' : 'year'}`}>1962 /</span> {description}</h3>
            {/* Additional content */}



            <Image
                src="/images/PtF6.png"
                width={439}
                height={434}
                alt="Platinum(VI) fluoride; Platinum hexafluoride"
            />
        </section >
    );
}
