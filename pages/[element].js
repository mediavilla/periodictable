import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json';
import elementStyles from '../styles/element.module.css';
import getCategoryClassName from '../utils/getCategoryClassName';
import CustomElementContent from '../components/CustomElementContent';
import NavTop from '../components/NavTop';
import ElementCard from '../components/ElementCard';
import NavElement from '../components/NavElement';
import Borh from '../components/Bohr';
import Orbitals from '../components/Orbitals';
import TableSwitcher from '../components/TableSwitcher';
import NavMiniTable18 from '@/components/NavMiniTable18';
import NavMiniTable32 from '@/components/NavMiniTable32';
import NavMiniTableRaceTrack from '@/components/NavMiniTableRaceTrack';

export default function Element({ element }) {
    const router = useRouter();
    const { element } = router.query;
    const { setCurrentElement, tableType } = useContext(TableContext);


    useEffect(() => {
        setCurrentElement(element);
    }, [element]);

    if (!element) {
        return <div>Please select an element!</div>;
    }


} return (
    <main>
        <NavElement />
        <NavTop />
        <div id="content">
            <TableSwitcher
                elements={elementsData}
                TableComponent18={NavMiniTable18}
                TableComponent32={NavMiniTable32}
                TableComponentRaceTrack={NavMiniTableRaceTrack}
            />

            <section className={elementStyles.cardBorhOrbitals}>
                <ElementCard element={element} getCategoryClassName={getCategoryClassName} />
                <Borh element={element} getCategoryClassName={getCategoryClassName} />
                <Orbitals element={element} />
            </section>
            <CustomElementContent element={element.name} />
        </div>
    </main>
);


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
            elements: elementsData // pass the entire elementsData array as the elements prop
        },
    };
}