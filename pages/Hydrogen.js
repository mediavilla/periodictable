import { useContext } from 'react'
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json'; // import your elements data
import ElementCard from '../components/ElementCard';
import NavMiniTable from '../components/NavMiniTable';
import NavElement from '../components/NavElement';

import getCategoryClassName from '../utils/getCategoryClassName';

export default function Hydrogen({ element }) {

    const { currentElement } = useContext(TableContext);

    return (
        <div>
            <NavElement />
            <NavMiniTable element={element} />
            <ElementCard element={element} getCategoryClassName={getCategoryClassName} />
            <p>Custom hydrogen content here</p>
        </div>
    );
}



export async function getServerSideProps() {
    const elementData = elementsData.find(el => el.name.toLowerCase() === 'hydrogen');

    return {
        props: {
            element: elementData,
        },
    };
}

