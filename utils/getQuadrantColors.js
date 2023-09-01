import getCategoryHexColor from './getCategoryHexColor';

export function getAdjacentElements(currentElement, elements) {
    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    const topLeftElement = currentElement;
    const bottomLeftElement = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos + 1);
    const topRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos);
    const bottomRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos + 1);

    return { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const opacity = 0.2; // 20% opacity

export function updateBackgroundGradient(adjacentElements) {
    const topLeftColor = hexToRgba(getCategoryHexColor(adjacentElements.topLeftElement.category), opacity);
    const bottomLeftColor = adjacentElements.bottomLeftElement ? hexToRgba(getCategoryHexColor(adjacentElements.bottomLeftElement.category), opacity) : '#efefef';
    const topRightColor = adjacentElements.topRightElement ? hexToRgba(getCategoryHexColor(adjacentElements.topRightElement.category), opacity) : '#efefef';
    const bottomRightColor = adjacentElements.bottomRightElement ? hexToRgba(getCategoryHexColor(adjacentElements.bottomRightElement.category), opacity) : '#efefef';

    const gradient = `conic-gradient(from 1.5708rad at 50% 50%, ${bottomRightColor} 9%, ${bottomLeftColor} 41%, ${topLeftColor} 51%, ${topRightColor} 92%)`;

}


const getQuadrantColors = (currentElement, elements) => {
    if (!currentElement) return {};

    const { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement } = getAdjacentElements(currentElement, elements);

    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;


    return {
        topLeftColor: topLeftElement ? getCategoryHexColor(topLeftElement.category) : '#efefef',
        bottomLeftColor: bottomLeftElement ? getCategoryHexColor(bottomLeftElement.category) : '#efefef',
        topRightColor: topRightElement ? getCategoryHexColor(topRightElement.category) : '#efefef',
        bottomRightColor: bottomRightElement ? getCategoryHexColor(bottomRightElement.category) : '#efefef'
    };
};

export default getQuadrantColors;

