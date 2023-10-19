// getQuadrantColors.js

import getCategoryHexColor from './getCategoryHexColor';

export function getAdjacentElements(currentElement, elements) {
    if (!elements || !currentElement) {
        return {};
    }

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    const topLeftElement = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos) || null;
    const bottomLeftElement = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos + 1) || null;  // Changed to yPos + 1
    const topRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos) || null;
    const bottomRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos + 1) || null;  // Changed to yPos + 1

    return { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const opacity = 1; // 20% opacity
const opacityCurrent = 1; // 20% opacity

export function getQuadrantColors(currentElement, elements, direction) {
    if (!currentElement) return {};

    const { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement } = getAdjacentElements(currentElement, elements);

    console.log("Current Element:", currentElement);
    console.log("Top Left Element:", topLeftElement);
    console.log("Bottom Left Element:", bottomLeftElement);
    console.log("Top Right Element:", topRightElement);
    console.log("Bottom Right Element:", bottomRightElement);

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    const colors = {
        topLeftColor: topLeftElement ? hexToRgba(getCategoryHexColor(topLeftElement.category), opacityCurrent) : '#efefef',
        bottomLeftColor: bottomLeftElement ? hexToRgba(getCategoryHexColor(bottomLeftElement.category), opacity) : '#efefef',
        topRightColor: topRightElement ? hexToRgba(getCategoryHexColor(topRightElement.category), opacity) : '#efefef',
        bottomRightColor: bottomRightElement ? hexToRgba(getCategoryHexColor(bottomRightElement.category), opacity) : '#efefef'
    };

    return {
        colors
    }
}

export function getOffCanvasElements(direction, adjacentElements, elements) {
    if (!direction || !adjacentElements || !elements) {
        return {};
    }

    const { bottomLeftElement, bottomRightElement, topLeftElement, topRightElement } = adjacentElements;

    let offCanvasSquareOneElement = null;
    let offCanvasSquareTwoElement = null;

    if (direction === 'down') {
        offCanvasSquareOneElement = elements.find(el => el.col18Xpos === bottomLeftElement.col18Xpos && el.col18Ypos === bottomLeftElement.col18Ypos + 1) || null;
        offCanvasSquareTwoElement = elements.find(el => el.col18Xpos === bottomRightElement.col18Xpos && el.col18Ypos === bottomRightElement.col18Ypos + 1) || null;
    } else if (direction === 'up') {
        offCanvasSquareOneElement = elements.find(el => el.col18Xpos === topLeftElement.col18Xpos && el.col18Ypos === topLeftElement.col18Ypos - 1) || null;
        offCanvasSquareTwoElement = elements.find(el => el.col18Xpos === topRightElement.col18Xpos && el.col18Ypos === topRightElement.col18Ypos - 1) || null;
    } else if (direction === 'left') {
        offCanvasSquareOneElement = elements.find(el => el.col18Xpos === topLeftElement.col18Xpos - 1 && el.col18Ypos === topLeftElement.col18Ypos) || null;
        offCanvasSquareTwoElement = elements.find(el => el.col18Xpos === bottomLeftElement.col18Xpos - 1 && el.col18Ypos === bottomLeftElement.col18Ypos) || null;
    } else if (direction === 'right') {
        offCanvasSquareOneElement = elements.find(el => el.col18Xpos === topRightElement.col18Xpos + 1 && el.col18Ypos === topRightElement.col18Ypos) || null;
        offCanvasSquareTwoElement = elements.find(el => el.col18Xpos === bottomRightElement.col18Xpos + 1 && el.col18Ypos === bottomRightElement.col18Ypos) || null;
    }

    return { offCanvasSquareOneElement, offCanvasSquareTwoElement };
}

