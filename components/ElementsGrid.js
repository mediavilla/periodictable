import React from 'react'
import styles from '@/styles/periodicTable.module.css'

export default function ElementsGrid({ elements }) {
  return (
    <div className={styles.periodicTable}>
      {elements.map((element) => {
        // console.log(element.col18Xpos, element.col18Ypos); // Log the properties

        // Limit the atomic mass to 5 digits after the decimal point
        const atomicMass = parseFloat(element.atomic_mass).toFixed(5);

        return (
          <div
            key={element.number}
            className={styles.element}
            style={{
              gridColumn: element.col18Xpos,
              gridRow: element.col18Ypos,
            }}

          >
            <div className={styles.elementNumbers}>
              <div className={styles.atomicNumber}>{element.number}</div>
              <div className={styles.atomicMass}>{element.atomicMass}</div>
            </div>
            <div className={styles.symbol}>{element.symbol}</div>
            <div>{element.name}</div>
            <div>{element.econfig_shorthand}</div>
          </div>
        );
      })}
    </div>
  );
}
