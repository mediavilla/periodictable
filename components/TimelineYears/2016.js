import React, { useEffect } from 'react';
import ElementCard from '../ElementCard';
import elementStyles from '../../styles/periodicTable.module.css'

export default function Section2016({ description, elements, getCategoryClassName, selectedYear }) {

    const nihonium = elements.find((element) => element.symbol === 'Nh');
    const moscovium = elements.find((element) => element.symbol === 'Mc');
    const tennessine = elements.find((element) => element.symbol === 'Ts');
    const oganesson = elements.find((element) => element.symbol === 'Og');

    useEffect(() => {
        console.log('SELECTED YEAR IN CONTENT:', selectedYear); // Log the selectedYear value
    }, [selectedYear]);

    return (
        <section id="2016" className="milestone-section">
            <h3><span className={`${selectedYear === 2016 ? 'selectedYear' : 'year'}`}>2016 /</span> {description}</h3>
            {/* Additional content */}
            <div className={elementStyles.flexContainer}>

                <div className={elementStyles.flexItem}>
                    <ElementCard element={oganesson} getCategoryClassName={getCategoryClassName} />
                </div>

                <div className={elementStyles.flexItem}>
                    <ElementCard element={tennessine} getCategoryClassName={getCategoryClassName} />
                </div>

                <div className={elementStyles.flexItem}>
                    <ElementCard element={moscovium} getCategoryClassName={getCategoryClassName} />
                </div>

                <div className={elementStyles.flexItem}>
                    <ElementCard element={nihonium} getCategoryClassName={getCategoryClassName} />
                </div>

            </div>
            <div className={elementStyles.scale}>
                <div className={elementStyles.movingDiv}></div>
            </div>


        </section>
    );
}
