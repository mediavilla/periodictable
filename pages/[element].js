import React, { useContext, useEffect } from 'react';
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json';
import getCategoryClassName from '../utils/getCategoryClassName';
import CustomElementContent from '../components/CustomElementContent';
import elementStyles from '../styles/element.module.css';
import ElementCard from '../components/ElementCard';
import NavMiniTable from '../components/NavMiniTable';
import NavElement from '../components/NavElement';
import Borh from '../components/Bohr';
import Orbitals from '../components/Orbitals';

export default function Element({ element }) {

    const { setCurrentElement } = useContext(TableContext);

    useEffect(() => {
        setCurrentElement(element);
    }, [element]);

    return (
        <main>
            <NavElement />
            <div id="content">
                <NavMiniTable element={element} />
                <section className={elementStyles.cardBorhOrbitals}>
                    <ElementCard element={element} getCategoryClassName={getCategoryClassName} />
                    <Borh element={element} />
                    <Orbitals element={element} />
                </section>
                <CustomElementContent element={element.name} />
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