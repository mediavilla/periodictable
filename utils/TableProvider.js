import React, { useState } from 'react';

export const TableContext = React.createContext({
    currentElement: null,
    tableType: null,
    // additional fields as needed...
    setCurrentElement: () => { },
    setTableType: () => { },
    // additional setter methods as needed...
});

export function TableProvider({ children }) {
    const [currentElement, setCurrentElement] = useState(null);
    const [tableType, setTableType] = useState('18 columns'); // Default value set here

    // add additional state variables as needed...

    return (
        <TableContext.Provider value={{ currentElement, setCurrentElement, tableType, setTableType }}>
            {children}
        </TableContext.Provider>
    );
}
