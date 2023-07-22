import React from 'react';
import getCategoryHexColor from '../utils/getCategoryHexColor';

export default function Bohr({ element, svgSize }) {

    const atomicMass = element.atomic_mass.toFixed(0)
    const numberOfShells = element.shells.length
    const numberOfNeutrons = atomicMass - element.number
    const calculatedSize = 100 + (numberOfShells * 35)

    // Use svgSize prop if provided, otherwise use calculatedSize
    svgSize = svgSize || calculatedSize;

    console.log('svgSize: ', svgSize)

    function electrons(electron, orbit, diameter, radius, numberElectronsInShell) {
        const angle = (electron / (numberElectronsInShell / 2)) * Math.PI // Calculate the angle at which the element will be placed.
        const x = (radius * Math.cos(angle)) + (diameter / 2) // Calculate the x position of the element.
        const y = (radius * Math.sin(angle)) + (diameter / 2) // Calculate the y position of the element.

        return (
            <circle
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
            <circle key={orbit}
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                stroke="#333333"
                strokeWidth="1"
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
                radius = 40
                diameter = radius * 2
            } else {
                radius = (i * 20) + 40
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

        <div id="electronConfiguration" >
            <svg width={svgSize} height={svgSize}>
                <text x="50%"
                    y="44%"
                    textAnchor="middle"
                    fill="#000000"
                    fontSize="14px"
                    fontFamily="Arial"
                    dy=".3em">
                    p
                    <tspan baselineShift="super" fontSize="10px">+</tspan>
                    {element.number}
                </text>
                <text x="50%"
                    y="55%"
                    textAnchor="middle"
                    fill="#000000"
                    fontSize="14px"
                    fontFamily="Arial"
                    dy=".3em">
                    n
                    <tspan baselineShift="super" fontSize="10px">o</tspan>
                    {numberOfNeutrons}
                </text>

                {shellsOrbits()}
            </svg>

        </div >
    )
}
