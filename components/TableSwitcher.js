// components/TableSwitcher.jsx
import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import switcherStyles from '../styles/switcher.module.css';

export default function TableSwitcher() {
    const { setTableType } = useContext(TableContext);

    return (
        <div className={switcherStyles.pager}>
            <button onClick={() => setTableType("table18")}>
                <span className={`${switcherStyles.iconTable} ${switcherStyles.iconTable18}`}></span>Table 18 ssscolumns
            </button>
            <button onClick={() => setTableType("table32")}><span className={switcherStyles.iconTable32}></span>Table 32 columns</button>
            <button onClick={() => setTableType("tableRaceTrack")}><span className={switcherStyles.iconTableRaceTrack}></span>Race Track</button>
        </div>
    );
}
