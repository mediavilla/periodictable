import React from 'react';
import ElementCard from '../../components/ElementCard';
import getCategoryClassName from '../../utils/getCategoryClassName';
import elements from '../../public/elements.json'; // adjust path to your actual JSON file

export default function Element({ elementData }) {
    return (
        <>
            <div>Element: {elementData.name}</div>
            <ElementCard element={elementData} getCategoryClassName={getCategoryClassName} />;
        </>
    )
}

// This function gets called at build time on server-side.
// It won't be called on client-side, so you can even do direct database queries!
export async function getStaticProps({ params }) {
    // params contains the element 'name'. So we can fetch data based on that
    const elementData = elements.find(el => el.name.toLowerCase() === params.element.toLowerCase());

    // Pass element data to the page via props
    return { props: { elementData } }
}

// This function gets called at build time on server-side.
// It won't be called on client-side.
export async function getStaticPaths() {
    // We'll pre-render only these paths at build time.
    // { fallback: false } means other routes should 404.
    return {
        paths: elements.map((element) => ({
            params: { element: element.name },
        })),
        fallback: false,
    };
}
