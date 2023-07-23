import React from 'react';
import getCategoryHexColor from '../utils/getCategoryHexColor';
import bohrStyles from '../styles/bohrBackground.module.css'

export default function Bohr({ element }) {

    console.log('BOHR ELEMENT: ', element)

    if (!element) return null;

    const numberOfShells = element.shells.length
    const svgSize = 400 + (numberOfShells * 35)

    function electrons(electron, orbit, diameter, radius, numberElectronsInShell) {
        const angle = (electron / (numberElectronsInShell / 2)) * Math.PI // Calculate the angle at which the element will be placed.
        const x = (radius * Math.cos(angle)) + (diameter / 2) // Calculate the x position of the element.
        const y = (radius * Math.sin(angle)) + (diameter / 2) // Calculate the y position of the element.

        return (
            <circle
                className={bohrStyles.electron}
                key={"" + electron + orbit}
                cx={((svgSize / 2) - radius) + x}
                cy={((svgSize / 2) - radius) + y}
                r="6"
                fill={getCategoryHexColor(element.category)}
            />
        )
    }

    function orbits(radius, orbit) {
        return (
            <circle className={bohrStyles.orbit} key={orbit}
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                stroke="#333333"
                strokeWidth="10"
                fill="none"
            />
        )
    }

    function shellsOrbits() {

        let children = []

        for (let i = 0; i <= numberOfShells - 1; i++) {
            let numberElectronsInShell = element.shells[i]
            let radius, diameter

            if (i === 0) { // Just one orbit, like Hydrogen
                radius = svgSize * 0.2 // 20% of svgSize
                diameter = radius * 2
            } else {
                radius = (i * svgSize * 0.1) + svgSize * 0.2 // Increment each orbit by 10% of svgSize
                diameter = radius * 2
            }

            children.push(orbits(radius, i))

            for (let j = 1; j <= numberElectronsInShell; j++) {
                children.push(
                    electrons(j, i, diameter, radius, numberElectronsInShell)
                )
            }
        }

        return children
    }


    return (

        <div id="bohrModelBackground" style={{ position: 'absolute', zIndex: '-1' }}>
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
                {shellsOrbits()}
            </svg>

        </div >
    )
}
