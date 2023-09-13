// components/TableRenderer.js
import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';

export default function TableRenderer({ elements, currentElement, setCurrentElement, TableComponent18, TableComponent32, TableComponentRaceTrack }) {
    const { tableType } = useContext(TableContext);

    switch (tableType) {
        case "table18":
            return <TableComponent18 elements={elements} currentElement={currentElement} setCurrentElement={setCurrentElement} />;
        case "table32":
            return <TableComponent32 elements={elements} currentElement={currentElement} setCurrentElement={setCurrentElement} />;
        case "tableRaceTrack":
            return <TableComponentRaceTrack elements={elements} currentElement={currentElement} setCurrentElement={setCurrentElement} />;
        default:
            return <TableComponent18 elements={elements} currentElement={currentElement} setCurrentElement={setCurrentElement} />;
    }
}
