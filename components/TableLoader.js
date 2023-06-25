import React, { useState } from "react";
import Table18Cols from './Table18Cols';
import Table32Cols from './Table32Cols';

export default function TableLoader({ elements }) {
    const [currentTable, setCurrentTable] = useState("table1");



    return (
        <div>
            <button onClick={() => setCurrentTable("table18")}>Table 18 columns</button>
            <button onClick={() => setCurrentTable("table32")}>Table 32 columns</button>
            {currentTable === "table18" ? (
                <Table18Cols elements={elements} />
            ) : (
                <Table32Cols elements={elements} />
            )}
        </div>
    );
}
