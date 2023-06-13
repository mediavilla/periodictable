import elementsData from '../public/elements.json';

export default function fetchElement(elementName) {
    return elementsData.find(el => el.name.toLowerCase() === elementName.toLowerCase());
}
