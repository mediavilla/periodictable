// components/TableSwitcher.jsx
import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import switcherStyles from '../styles/switcher.module.css';

export default function TableSwitcher() {

    const { tableType, setTableType } = useContext(TableContext);


    const getButtonClass = (type) => {
        return tableType === type ? switcherStyles.selected : '';
    };
 
    return (
        <div className={switcherStyles.pager}>
            <button className={getButtonClass("table18")} onClick={() => setTableType("table18")}>
                <span className={`${switcherStyles.iconTable} ${switcherStyles.iconTable18}`}></span>
                <span className={switcherStyles.buttonText}>18 columns</span>
            </button>
            <button className={getButtonClass("table32")} onClick={() => setTableType("table32")}>
                <span className={`${switcherStyles.iconTable} ${switcherStyles.iconTable32}`}></span>
                <span className={switcherStyles.buttonText}>32 columns</span>
            </button>
            <button className={getButtonClass("tableRaceTrack")} onClick={() => setTableType("tableRaceTrack")}>
                <span className={`${switcherStyles.iconTable} ${switcherStyles.iconTableRT}`}></span>
                <span className={switcherStyles.buttonText}>Race Track</span>
            </button>
        </div>
    );
}
