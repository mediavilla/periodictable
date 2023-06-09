import { ElementCard } from '../../components/ElementCard';
import * as elementComponents from './elementComponents';
import DefaultElement from './Default';
import getCategoryClassName from '../../utils/getCategoryClassName';

const withElementComponent = (Component) => {
    return ({ elementSymbol, ...props }) => {
        // Select the appropriate component or fallback to DefaultElement
        const ElementComponent = elementComponents[elementSymbol] || DefaultElement;

        // Render the selected component
        return <ElementComponent {...props} />;
    };
};

const ElementPage = ({ element, ...props }) => {
    const ElementCardWithComponent = withElementComponent(ElementCard);

    const elementData = elements.find(e => e.symbol === element.symbol);

    return (
        <>
            <ElementCard element={moscovium} getCategoryClassName={getCategoryClassName} />
            <ElementCardWithComponent elementSymbol={element.symbol} {...elementData} />
        </>
    );
};

export async function getServerSideProps({ params }) {
    return { props: { element: params.element } };
}

export default ElementPage;
