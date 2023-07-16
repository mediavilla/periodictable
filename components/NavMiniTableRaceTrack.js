import React, { useEffect, useState } from "react";
import SVG from 'react-inlinesvg';
import elementStyles from '../styles/periodicTable.module.css'
import getCategoryClassName from '../utils/getCategoryClassName';

export default function NavMiniTableRaceTrack() {
    const [svgSource, setSvgSource] = useState(null);

    useEffect(() => {
        fetch('./TableRaceTrack.svg')
            .then(response => response.text())
            .then(data => setSvgSource(data));
    }, []);

    if (!svgSource) {
        return null;
    }

    return (
        <section className={elementStyles.NavMiniTable}>
            <div>
                <SVG src={svgSource} width="400" height="auto" />
            </div>
        </section>
    )
}
