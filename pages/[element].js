import { elementsData } from '../data/elementsData';
import elements from '../public/elements.json';

export default function Element({ elements }) {
    // your component logic
}

export async function getServerSideProps(context) {
    const { element } = context.params;
    const elements = elementsData.find(el => el.name.toLowerCase() === element.toLowerCase());

    return {
        props: {
            elements,
        }
    };
}
