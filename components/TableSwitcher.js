import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';

export default function TableSwitcher({ elements, TableComponent18, TableComponent32 }) {
    const { tableType, setTableType } = useContext(TableContext);

    function renderTable() {
        switch (tableType) {
            case "table18":
                return <TableComponent18 elements={elements} />;
            case "table32":
                return <TableComponent32 elements={elements} />;
            default:
                return <TableComponent18 elements={elements} />;
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
