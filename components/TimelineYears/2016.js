import React, { useEffect } from 'react';
import ElementCard from '../ElementCard';
import elementStyles from '../../styles/periodicTable.module.css';
import timeStyles from '../../styles/Section2016.module.css';

export default function Section2016({ description, elements, getCategoryClassName, selectedYear }) {

    const nihonium = elements.find((element) => element.symbol === 'Nh');
    const moscovium = elements.find((element) => element.symbol === 'Mc');
    const tennessine = elements.find((element) => element.symbol === 'Ts');
    const oganesson = elements.find((element) => element.symbol === 'Og');

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

            <div id="decayTimeline">
                <div className={timeStyles.blocky}>
                    <div className={timeStyles.msText}>
                        <div className={timeStyles.msTextItem}>0</div>
                        <div className={timeStyles.msTextItem}>25ms</div>
                        <div className={timeStyles.msTextItem}>50ms</div>
                        <div className={timeStyles.msTextItem}>75ms</div>
                        <div className={timeStyles.msTextItem}>100ms</div>
                    </div>
                </div>
                <div className={timeStyles.blocky}>
                    <div className={timeStyles.scale}>
                        <div className={timeStyles.handlerTime}>&nbsp;</div>
                    </div>
                </div>
                <div className={timeStyles.blocky}></div>
                <div className={timeStyles.blocky}>
                    <div className={timeStyles.timeText}>
                        <div className={timeStyles.timeTextItem}>0</div>
                        <div className={timeStyles.timeTextItem}>100ms</div>
                        <div className={timeStyles.timeTextItem}>500ms</div>
                        <div className={timeStyles.timeTextItem}>&nbsp;</div>
                        <div className={timeStyles.timeTextItem}>1 second</div>
                    </div>
                </div>
                <div className={timeStyles.blocky}>
                    <div className={timeStyles.oneSecond}>
                        <div className={timeStyles.oneHundredMiliseconds}>
                            <div className={timeStyles.handlerTime}>&nbsp;</div>
                        </div>
                        <div className={timeStyles.nineHundredMiliseconds}></div>
                    </div>
                </div>
            </div >

        </section >
    );
}
