import React from 'react';
import ElementCard from '../../components/ElementCard';
import getCategoryClassName from '../../utils/getCategoryClassName';
import elements from '../../public/elements.json'; // adjust path to your actual JSON file
import dynamic from 'next/dynamic'

export default function Element({ elementData }) {
    // Dynamically import the element component based on the element name
    const ElementContent = dynamic(() =>
        import(`./${elementData.name}.js`).catch(() => () => null)
    );

    return (
        <>
            <div>Element: {elementData.name}</div>
            <ElementCard element={elementData} getCategoryClassName={getCategoryClassName} />
            <ElementContent /> {/* Render the specific element component */}
        </>
    )
}

export async function getStaticProps({ params }) {
    const elementData = elements.find(el => el.name.toLowerCase() === params.element.toLowerCase());

    return { props: { elementData } }
}

export async function getStaticPaths() {
    return {
        paths: elements.map((element) => ({
            params: { element: element.name },
        })),
        fallback: false,
    };
}
