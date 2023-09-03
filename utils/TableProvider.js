import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import fetchElement from './fetchElement';
import elements from '../public/elements.json';

export const TableContext = React.createContext({
    currentElement: null,
    tableType: null,
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

    // Hover state variables
    const [prevCol18Xpos, setPrevCol18Xpos] = useState(null);
    const [prevCol18Ypos, setPrevCol18Ypos] = useState(null);

    // useEffect for logging
    useEffect(() => {
        console.log('### New currentElement:', currentElement);
    }, [currentElement]);


    const defaultElement = elements[0]; // Assuming elements is an array of element objects

    // useEffect for setting default element
    useEffect(() => {
        if (!currentElement) setCurrentElement(defaultElement);
    }, []);

    // useEffect for updating prevCol18Xpos and prevCol18Ypos
    useEffect(() => {
        if (currentElement) {
            setPrevCol18Xpos(currentElement.col18Xpos);
            setPrevCol18Ypos(currentElement.col18Ypos);
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

        <TableContext.Provider value={{ currentElement, setCurrentElement, tableType, setTableType, loading }}>
            {children}
        </TableContext.Provider>
    );
}

