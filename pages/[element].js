import React, { useContext, useEffect } from 'react';
import { TableContext } from '../utils/TableProvider'; // adjust the path accordingly
import elementsData from '../public/elements.json'; // import your elements data
import ElementCard from '../components/ElementCard';
import NavMiniTable from '../components/NavMiniTable';
import NavElement from '../components/NavElement';
import getCategoryClassName from '../utils/getCategoryClassName';

export default function Element({ element }) {

    console.log("Table Context: ", TableContext);

    const { setCurrentElement } = useContext(TableContext);

    useEffect(() => {
        setCurrentElement(element);
    }, [element]);

    return (
        <main>
            <NavElement />
            <div id="content">
                <NavMiniTable element={element} />
                <ElementCard element={element} getCategoryClassName={getCategoryClassName} />
                <p>Custom hydrogen content here</p>
            </div>
        </main>
    );
}

export async function getServerSideProps({ params }) {
    const elementData = elementsData.find(el => el.name.toLowerCase() === params.element.toLowerCase());

    if (!elementData) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            element: elementData,
        },
    };
}