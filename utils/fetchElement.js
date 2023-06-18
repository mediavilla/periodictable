import elementsData from '../public/elements.json';


export default function fetchElement(elementName) {
    const elementData = elementsData.find(el => el.name.toLowerCase() === elementName.toLowerCase());

    if (!elementData) {
        console.warn(`No element found for name: ${elementName}`);
    }

    console.log("Element Data: ", elementData);
    return elementData;
}

