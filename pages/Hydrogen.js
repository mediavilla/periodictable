import fetchElement from '../utils/fetchElement';
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
    const elementData = fetchElement('hydrogen');

    return {
        props: {
            element: elementData,
        },
    };
}
