import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import switcherStyles from '../styles/switcher.module.css';

export default function TableSwitcher({ elements, currentElement, setCurrentElement, TableComponent18, TableComponent32, TableComponentRaceTrack }) {

    const { tableType, setTableType } = useContext(TableContext);

    function renderTable() {
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

    return (
        <div>
            <div className={switcherStyles.pager}>
                <button onClick={() => setTableType("table18")}>Table 18 columns</button>
                <button onClick={() => setTableType("table32")}>Table 32 columns</button>
                <button onClick={() => setTableType("tableRaceTrack")}>Race Track</button>
            </div>
            {renderTable()}
        </div>
    );
}
