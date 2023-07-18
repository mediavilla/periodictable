const fs = require('fs');
const path = require('path');

// File paths
const inputFilePath = path.join(__dirname, 'links.txt');
const outputFilePath = path.join(__dirname, 'updated.txt');

// Read the input file
const lines = fs.readFileSync(inputFilePath, 'utf8').split('\n');

// Array to hold the updated lines
let updatedLines = [];

// Regular expression to match the className prop and href prop
const classPattern = /(className=\{raceTrackStyle.e\w+\})/;
const hrefPattern = /href="\/(\w+)"/;

// Process each line
lines.forEach(line => {
    const classMatch = line.match(classPattern);
    const hrefMatch = line.match(hrefPattern);

    if (classMatch && hrefMatch) {
        const elementName = hrefMatch[1].charAt(0).toUpperCase() + hrefMatch[1].slice(1); // Capitalize first letter
        const newClassProp = `className={\`${classMatch[1].split('=')[1]} ${'$'}{currentElement.name === '${elementName}' ? raceTrackStyle.selected : ''}\`}`;
        const updatedLine = line.replace(classMatch[0], newClassProp);
        updatedLines.push(updatedLine);
    } else {
        updatedLines.push(line); // If no match, keep the original line
    }
});

// Write the updated lines to the output file
fs.writeFileSync(outputFilePath, updatedLines.join('\n'));
