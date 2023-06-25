import React, { useState } from "react";
import Table18Cols from './Table18Cols';
import Table32Cols from './Table32Cols';

export default function TableLoader({ elements }) {
    const [currentTable, setCurrentTable] = useState("table18");

    function renderTable() {
        switch (currentTable) {
            case "table18":
                return <Table18Cols elements={elements} />;
            case "table32":
                return <Table32Cols elements={elements} />;
            // Add more case statements as you add more tables
            default:
                return <Table18Cols elements={elements} />; // Default to Table18Cols if currentTable doesn't match any case
        }
    }

    return (
        <div>
            <button onClick={() => setCurrentTable("table18")}>Table 18 columns</button>
            <button onClick={() => setCurrentTable("table32")}>Table 32 columns</button>
            {renderTable()}
        </div>
    );
}
