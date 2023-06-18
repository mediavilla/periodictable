import React, { useEffect, useState } from 'react';

export default function CustomElementContent({ element }) {
    const [ElementComponent, setElementComponent] = useState(null);

    useEffect(() => {
        const importElementComponent = async () => {
            try {
                const { default: component } = await import(`./Elements/${element}`);
                setElementComponent(component);
            } catch (error) {
                console.error(`Failed to load component for ${element}:`, error);
            }
        };

        importElementComponent();
    }, [element]);

    if (!ElementComponent) {
        // Render a placeholder or loading state while the component is being loaded
        return <p>Loading...</p>;
    }

    return <ElementWrapper>{ElementComponent}</ElementWrapper>;
}

function ElementWrapper({ children }) {
    return <>{children}</>;
}
