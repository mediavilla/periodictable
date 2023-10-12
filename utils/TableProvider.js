import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import fetchElement from './fetchElement';
import elements from '../public/elements.json';

export const TableContext = React.createContext({
    currentElement: null,
    tableType: null,
    elements: null,
    // additional fields as needed...
    setCurrentElement: () => { },
    setTableType: () => { },
    // additional setter methods as needed...
});

export function TableProvider({ children }) {
    const router = useRouter();
    const [currentElement, setCurrentElement] = useState(null);
    const [tableType, setTableType] = useState('18 columns'); // Default value set here
    const [loading, setLoading] = useState(true);

    // Create a ref to store the previous values
    const prevCol18XposRef = useRef(null);
    const prevCol18YposRef = useRef(null);

    const defaultElement = elements[0]; // Assuming elements is an array of element objects

    // useEffect for setting default element
    useEffect(() => {
        if (!currentElement) setCurrentElement(defaultElement);
    }, []);


    // Update the ref with the current values after each render
    useEffect(() => {
        if (currentElement) {
            prevCol18XposRef.current = currentElement.col18Xpos;
            prevCol18YposRef.current = currentElement.col18Ypos;
        }
    }, [currentElement]);

    useEffect(() => {
        if (router.isReady) {

            const elementName = router.query.element;

            if (!elementName || elementName === "[element]") {

            } else {
                const fetchAndSetElement = async () => {
                    const currentElementData = await fetchElement(elementName);
                    setCurrentElement(currentElementData);
                    setLoading(false);
                };

                fetchAndSetElement();
            }
        }
    }, [router.isReady, router.pathname]);

    return (

        <TableContext.Provider value={{
            elements,
            currentElement,
            setCurrentElement,
            tableType,
            setTableType,
            loading,
            prevCol18Xpos: prevCol18XposRef.current, // Use the ref's current value
            prevCol18Ypos: prevCol18YposRef.current  // Use the ref's current value
        }}>
            {children}
        </TableContext.Provider>
    );
}