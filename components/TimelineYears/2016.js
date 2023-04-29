import React from 'react';
import elementStyles from '../../styles/periodicTable.module.css';

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
            <div class="flex-container">
                <div class="flex-item">

                    <div className={`${elementStyles.element} ${praseodymium.category} ${getCategoryClassName(praseodymium.category)} ${elementStyles.elementCardBigContainer}`}>
                        <div className={`${elementStyles.elementCardBig} `}>
                            <div className={elementStyles.atomicNumber}>{praseodymium.number}</div>
                            <div className={elementStyles.symbol}>{praseodymium.symbol}</div>
                            <div className={elementStyles.name}>{praseodymium.name}</div>
                            <div className={elementStyles.econfig}>{praseodymium.econfig_shorthand}</div>
                        </div>
                    </div>

                </div>
                <div class="flex-item">

                    <div className={`${elementStyles.element} ${praseodymium.category} ${getCategoryClassName(praseodymium.category)} ${elementStyles.elementCardBigContainer}`}>
                        <div className={`${elementStyles.elementCardBig} `}>
                            <div className={elementStyles.atomicNumber}>{praseodymium.number}</div>
                            <div className={elementStyles.symbol}>{praseodymium.symbol}</div>
                            <div className={elementStyles.name}>{praseodymium.name}</div>
                            <div className={elementStyles.econfig}>{praseodymium.econfig_shorthand}</div>
                        </div>
                    </div>

                </div>
                <div class="flex-item">

                    <div className={`${elementStyles.element} ${praseodymium.category} ${getCategoryClassName(praseodymium.category)} ${elementStyles.elementCardBigContainer}`}>
                        <div className={`${elementStyles.elementCardBig} `}>
                            <div className={elementStyles.atomicNumber}>{praseodymium.number}</div>
                            <div className={elementStyles.symbol}>{praseodymium.symbol}</div>
                            <div className={elementStyles.name}>{praseodymium.name}</div>
                            <div className={elementStyles.econfig}>{praseodymium.econfig_shorthand}</div>
                        </div>
                    </div>
                </div>
                <div class="flex-item">

                    <div className={`${elementStyles.element} ${praseodymium.category} ${getCategoryClassName(praseodymium.category)} ${elementStyles.elementCardBigContainer}`}>
                        <div className={`${elementStyles.elementCardBig} `}>
                            <div className={elementStyles.atomicNumber}>{praseodymium.number}</div>
                            <div className={elementStyles.symbol}>{praseodymium.symbol}</div>
                            <div className={elementStyles.name}>{praseodymium.name}</div>
                            <div className={elementStyles.econfig}>{praseodymium.econfig_shorthand}</div>
                        </div>
                    </div>
                </div>
            </div>


        </section>
    );
}
