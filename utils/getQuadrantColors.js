// getQuadrantColors.js

import getCategoryHexColor from './getCategoryHexColor';

const opacity = 1; // 20% opacity
const opacityCurrent = 1; // 20% opacity

// Function to get adjacent elements based on the current element
export function getAdjacentElements(currentElement, elements) {
    // console.log("Received currentElement:", currentElement);
    // console.log("Received elements:", elements);
    // Ensure elements is an array before proceeding
    if (!Array.isArray(elements) || !currentElement) {
        return {};
    }

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    const topLeftElement = currentElement;

    const bottomLeftElement = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos + 1) || null;
    const topRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos) || null;
    const bottomRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos + 1) || null;


    return { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement };
}

// Function to get off-canvas elements based on the current element and direction
export function getOffCanvasElements(currentElement, elements, direction) {
    console.log("getOffCanvasElements, currentElement: ", currentElement)
    // console.log("getOffCanvasElements, elements: ", elements)
    console.log("getOffCanvasElements, direction: ", direction)
    if (!elements || !currentElement) {
        return {};
    }

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    let offCanvasSquareOne = null;
    let offCanvasSquareTwo = null;

    if (direction === 'down') {
        console.log("offCanvas Direction: DOWN")
        offCanvasSquareOne = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos + 1) || null;
        offCanvasSquareTwo = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos + 1) || null;
        console.log("offCanvasSquareOne: ", offCanvasSquareOne)
        console.log("offCanvasSquareTwo: ", offCanvasSquareTwo)
    }
    if (direction === 'up') {
        console.log("offCanvas Direction: UP")
        offCanvasSquareOne = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos - 1) || null;
        offCanvasSquareTwo = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos - 1) || null;
        console.log("offCanvasSquareOne: ", offCanvasSquareOne)
        console.log("offCanvasSquareTwo: ", offCanvasSquareTwo)
    }
    if (direction === 'right') {
        console.log("offCanvas Direction: RIGHT")
        offCanvasSquareOne = elements.find(el => el.col18Ypos === yPos && el.col18Xpos === xPos + 1) || null;
        offCanvasSquareTwo = elements.find(el => el.col18Ypos === yPos + 1 && el.col18Xpos === xPos + 1) || null;
        console.log("offCanvasSquareOne: ", offCanvasSquareOne)
        console.log("offCanvasSquareTwo: ", offCanvasSquareTwo)
    }
    if (direction === 'left') {
        console.log("offCanvas Direction: LEFT")
        offCanvasSquareOne = elements.find(el => el.col18Ypos === yPos && el.col18Xpos === xPos - 1) || null;
        offCanvasSquareTwo = elements.find(el => el.col18Ypos === yPos + 1 && el.col18Xpos === xPos - 1) || null;
        console.log("offCanvasSquareOne: ", offCanvasSquareOne)
        console.log("offCanvasSquareTwo: ", offCanvasSquareTwo)
    }
    return { offCanvasSquareOne, offCanvasSquareTwo };
}

// Function to convert HEX to RGBA
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// Function to get quadrant colors based on the current element
export function getQuadrantColors(currentElement, elements) {

    console.log("getQuadrantColors START:", currentElement)

    if (!currentElement) return {};

    const { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement } = getAdjacentElements(currentElement, elements);

    const colors = {
        topLeftColor: topLeftElement ? hexToRgba(getCategoryHexColor(topLeftElement.category), opacityCurrent) : '#efefef',
        bottomLeftColor: bottomLeftElement ? hexToRgba(getCategoryHexColor(bottomLeftElement.category), opacity) : '#efefef',
        topRightColor: topRightElement ? hexToRgba(getCategoryHexColor(topRightElement.category), opacity) : '#efefef',
        bottomRightColor: bottomRightElement ? hexToRgba(getCategoryHexColor(bottomRightElement.category), opacity) : '#efefef'
    };

    console.log("getQuadrantColors Quadrant Colors:", colors);

    return colors;
};

// Function to get off-canvas square colors based on the current element
export function getOffCanvasSquaresColors(currentElement, elements, direction) {

    if (!currentElement) return {};

    // Get off-canvas elements based on the current element
    const { offCanvasSquareOne, offCanvasSquareTwo } = getOffCanvasElements(currentElement, elements, direction);

    // Define colors for off-canvas squares
    const offColors = {
        offCanvasSquareOneColor: offCanvasSquareOne ? hexToRgba(getCategoryHexColor(offCanvasSquareOne.category), opacity) : '#efefef',
        offCanvasSquareTwoColor: offCanvasSquareTwo ? hexToRgba(getCategoryHexColor(offCanvasSquareTwo.category), opacity) : '#efefef',

    };
    console.log("offColors: ", offColors)
    return offColors;
};