const fs = require('fs');

// Read the original JSON data
console.log('Reading original JSON data...');
const rawData = fs.readFileSync('../public/elements.json', 'utf-8');
const elements = JSON.parse(rawData);

// Function to update elements with both extended and standard column and row values
function updateElement(element) {
    const { xpos, ypos, ...updatedElement } = element;

    // Calculate the standardColumn and standardRow based on the xpos and ypos
    const { standardColumn, standardRow } = calculateStandardPositions(xpos, ypos);

    updatedElement['col32Xpos'] = xpos;
    updatedElement['col18Xpos'] = standardColumn;
    updatedElement['col32Ypos'] = ypos;
    updatedElement['col18Ypos'] = standardRow;

    return updatedElement;
}

// Function to calculate the standard column and row values based on the extended column and row
function calculateStandardPositions(xpos, ypos) {
    let standardColumn;
    let standardRow = ypos;

    if ((ypos === 6 || ypos === 7) && (xpos >= 4 && xpos <= 17)) {
        // Lanthanides and Actinides
        standardColumn = xpos; // Start at column 4 for both layouts
        standardRow = (ypos === 6) ? 9 : 10; // Move Lanthanides to row 9 and Actinides to row 10 in the 18-column layout
    } else {
        standardColumn = xpos;
    }

    return { standardColumn, standardRow };
}


// Update the elements and write the updated data to a new JSON file
console.log('Updating elements...');
const updatedElements = elements.map(updateElement);
console.log('Writing updated data to JSON file...');
fs.writeFileSync('../public/elementsnew.json', JSON.stringify(updatedElements, null, 2));
console.log('JSON file updated successfully.');
