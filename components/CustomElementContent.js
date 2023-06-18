import React, { useEffect, useState } from 'react';

export default function CustomElementContent({ element }) {
    const [ElementComponent, setElementComponent] = useState(null);

    useEffect(() => {
        const importElementComponent = async () => {
            const component = await import(`./Elements/${element}`);
            setElementComponent(component.default);
        };
        importElementComponent();
    }, [element]);

    if (!ElementComponent) {
        // Render a placeholder or loading state while the component is being loaded
        return <p>Loading...</p>;
    }

    return <ElementComponent />;
}
