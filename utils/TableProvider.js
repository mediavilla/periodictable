import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import fetchElement from './fetchElement';

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

    useEffect(() => {
        console.log('### New currentElement:', currentElement);
    }, [currentElement]);

    useEffect(() => {
        if (router.isReady) {
            console.log("### Router Pathname", router.pathname)

            const elementName = router.query.element;

            console.log("### Router query", router.query);

            console.log("### Element Name", elementName)

            if (!elementName || elementName === "[element]") {
                console.log('No element name found or placeholder value used')
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

