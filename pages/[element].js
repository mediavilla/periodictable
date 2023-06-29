import React, { useContext, useEffect } from 'react';
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json';
import getCategoryClassName from '../utils/getCategoryClassName';
import CustomElementContent from '../components/CustomElementContent';
import elementStyles from '../styles/element.module.css';
import ElementCard from '../components/ElementCard';
import NavMiniTable18 from '../components/NavMiniTable18';
import NavMiniTable32 from '../components/NavMiniTable32';
import NavElement from '../components/NavElement';
import Borh from '../components/Bohr';
import Orbitals from '../components/Orbitals';

export default function Element({ element }) {

    const { setCurrentElement, tableType } = useContext(TableContext);


    useEffect(() => {
        setCurrentElement(element);
    }, [element]);

    function renderNavTable() {
        switch (tableType) {
            case "table18":
                return <NavMiniTable18 element={element} />;
            case "table32":
                return <NavMiniTable32 element={element} />;
            // Add more case statements as you add more tables
            default:
                return <NavMiniTable18 element={element} />; // Default to NavMiniTable if tableType doesn't match any case
        }
    }

    return (
        <main>
            <NavElement />
            <div id="content">
                {renderNavTable()}
                <section className={elementStyles.cardBorhOrbitals}>
                    <ElementCard element={element} getCategoryClassName={getCategoryClassName} />
                    <Borh element={element} getCategoryClassName={getCategoryClassName} />
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