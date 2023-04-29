import React from 'react';
import ElementCard from '../ElementCard';
import elementStyles from '../../styles/periodicTable.module.css'

export default function Section2016({ description, elements, getCategoryClassName }) {

    const nihonium = elements.find((element) => element.symbol === 'Nh');
    const moscovium = elements.find((element) => element.symbol === 'Mc');
    const tennessine = elements.find((element) => element.symbol === 'Ts');
    const oganesson = elements.find((element) => element.symbol === 'Og');

    return (
        <section id="2016" className="milestone-section">
            <h2>2016</h2>
            <p>{description}</p>
            {/* Additional content */}
            <div className={elementStyles.flexContainer}>
                <div className={elementStyles.flexItem}>
                    <ElementCard element={nihonium} getCategoryClassName={getCategoryClassName} />
                </div>
                <div className={elementStyles.flexItem}>
                    <ElementCard element={moscovium} getCategoryClassName={getCategoryClassName} />
                </div>
                <div className={elementStyles.flexItem}>
                    <ElementCard element={tennessine} getCategoryClassName={getCategoryClassName} />
                </div>
                <div className={elementStyles.flexItem}>
                    <ElementCard element={oganesson} getCategoryClassName={getCategoryClassName} />
                </div>
            </div>


        </section>
    );
}
