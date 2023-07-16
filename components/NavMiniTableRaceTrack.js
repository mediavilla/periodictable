import React, { useEffect, useState } from "react";
import SVG from 'react-inlinesvg';

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

    return <SVG src={svgSource} />;
}
