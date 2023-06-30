import React, { useContext } from 'react';
import Link from 'next/link';
import { TableContext } from '../utils/TableProvider';
import NavMiniTable18 from './NavMiniTable18';
import NavMiniTable32 from './NavMiniTable32';

export default function TableLoader({ elements }) {
    const { tableType, setTableType } = useContext(TableContext);

    function renderTable() {
        switch (tableType) {
            case "table18":
                return <NavMiniTable18 elements={elements} />;
            case "table32":
                return <NavMiniTable32 elements={elements} />;
            // Add more case statements as you add more tables
            default:
                return <NavMiniTable18 elements={elements} />; // Default to Table18Cols if tableType doesn't match any case
        }
    }

    return (
        <div>
            <Link href='./'>Back</Link>
            <button onClick={() => setTableType("table18")}>Table 18 columns</button>
            <button onClick={() => setTableType("table32")}>Table 32 columns</button>
            {renderTable()}

        </div>
    );
}
