import elementsData from '../public/elements.json';

export default function fetchElement(elementName) {
    console.log("Requested Element Name: ", elementName); // Added line
    console.log("First Element in Data: ", elementsData[0]); // Added line

    const elementData = elementsData.find(el => el.name.toLowerCase() === elementName.toLowerCase());

    console.log("Element Data: ", elementData);
    return elementData;
}
