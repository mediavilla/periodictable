import elementsData from '../public/elements.json'; // import your elements data
import ElementCard from '../components/ElementCard';
import getCategoryClassName from '../utils/getCategoryClassName';

export default function Hydrogen({ element }) {
    return (
        <div>
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

