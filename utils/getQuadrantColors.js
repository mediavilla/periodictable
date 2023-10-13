import getCategoryHexColor from './getCategoryHexColor';

export function getAdjacentElements(currentElement, elements) {

    if (!elements || !currentElement) {
        return {};
    }

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    const topLeftElement = currentElement;
    // console.log("Current Element :", currentElement)
    const bottomLeftElement = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos + 1);
    const topRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos);
    // console.log("TopRight :", currentElement)
    const bottomRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos + 1);

    return { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const opacity = 0.1; // 20% opacity
const opacityCurrent = 0.3; // 20% opacity

export function getQuadrantColors(currentElement, elements) {
    if (!currentElement) return {};

    const { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement } = getAdjacentElements(currentElement, elements);

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    return {
        topLeftColor: topLeftElement ? hexToRgba(getCategoryHexColor(topLeftElement.category), opacityCurrent) : '#efefef',
        bottomLeftColor: bottomLeftElement ? hexToRgba(getCategoryHexColor(bottomLeftElement.category), opacity) : '#efefef',
        topRightColor: topRightElement ? hexToRgba(getCategoryHexColor(topRightElement.category), opacity) : '#efefef',
        bottomRightColor: bottomRightElement ? hexToRgba(getCategoryHexColor(bottomRightElement.category), opacity) : '#efefef'
    };
};


