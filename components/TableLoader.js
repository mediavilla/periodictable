import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import Table18Cols from './Table18Cols';
import Table32Cols from './Table32Cols';

export default function TableLoader({ elements }) {
    const { tableType, setTableType } = useContext(TableContext);

    function renderTable() {
        switch (tableType) {
            case "table18":
                return <Table18Cols elements={elements} />;
            case "table32":
                return <Table32Cols elements={elements} />;
            // Add more case statements as you add more tables
            default:
                return <Table18Cols elements={elements} />; // Default to Table18Cols if tableType doesn't match any case
        }
    }

    return (
        <div>
            <button onClick={() => setTableType("table18")}>Table 18 columns</button>
            <button onClick={() => setTableType("table32")}>Table 32 columns</button>
            {renderTable()}
        </div>
    );
}
