const fs = require("fs");

// Read the JSON file
const data = fs.readFileSync("../public/elements.json", "utf-8");
const elements = JSON.parse(data);

// Update the elements according to the specified conditions
const updatedElements = elements.map((element) => {
    if (element.col18Xpos >= 18 && element.col18Ypos <= 7) {
        return {
            ...element,
            col18Xpos: element.col18Xpos - 14,
        };
    }
    return element;
});

// Save the updated JSON
fs.writeFileSync("../public/updatedElements.json", JSON.stringify(updatedElements, null, 2));
