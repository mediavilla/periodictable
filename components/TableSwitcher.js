// components/TableSwitcher.jsx
import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import switcherStyles from '../styles/switcher.module.css';

export default function TableSwitcher() {
    const { setTableType } = useContext(TableContext);

    return (
        <div className={switcherStyles.pager}>
            <button onClick={() => setTableType("table18")}>Table 18 columns</button>
            <button onClick={() => setTableType("table32")}>Table 32 columns</button>
            <button onClick={() => setTableType("tableRaceTrack")}>Race Track</button>
        </div>
    );
}
