const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Read and parse the JSON data
const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/elements.json')));

// Read the SVG data
const svgData = fs.readFileSync(path.join(__dirname, '../public/images/TableRaceTrack.svg')).toString();

// Use JSDOM to parse the SVG
const dom = new JSDOM(svgData);
const svgDocument = dom.window.document;

const categoryClassMap = {
    'diatomic nonmetal': 'reactiveNonMetals',
    'polyatomic nonmetal': 'reactiveNonMetals',
    'alkali metal': 'AlkaliMetals',
    'alkaline earth metal': 'AlkalineEarthMetals',
    'transition metal': 'TransitionMetals',
    'lanthanide': 'lanthanide',
    'lanthanide lanthanum': 'lanthanum',
    'actinide': 'actinide',
    'actinide actinium': 'actinium',
    'post-transition metal': 'postTransitionMetal',
    'metalloid': 'metalloid',
    'noble gas': 'nobleGas',
    'unknown probably transition metal': 'unknownProperties',
    'unknown probably post-transition metal': 'unknownProperties',
    'unknown probably metalloid': 'unknownProperties',
    'unknown predicted to be noble gas': 'unknownProperties',
};

for (const element of jsonData) {
    // Find the corresponding SVG element using the atomic number
    const svgElement = svgDocument.querySelector(`#_${element.number}`);

    // If the SVG element exists, update its class
    if (svgElement) {
        // Get the class name for the category
        const categoryClassName = categoryClassMap[element.category];

        // Add the category class to the SVG element
        svgElement.classList.add(categoryClassName);
    } else {
        console.log(`SVG element not found for atomic number: ${element.number}`);
    }
}

// Write the modified SVG back to the file
fs.writeFileSync(path.join(__dirname, '../public/images/TableRaceTrack.svg'), svgDocument.documentElement.outerHTML);
