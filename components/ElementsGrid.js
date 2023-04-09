import React from 'react'
import styles from '@/styles/periodicTable.module.css'

export default function ElementsGrid({ elements }) {
  return (
    <div className={styles.periodicTable}>
      {elements.map((element) => {
        // console.log(element.col18Xpos, element.col18Ypos); // Log the properties

        // Calculate the number of digits before the decimal point
        const digitsBeforeDecimal = Math.floor(element.atomic_mass).toString().length;

        // Calculate the number of digits to display after the decimal point
        const digitsAfterDecimal = 4 - digitsBeforeDecimal;

        // Limit the atomic mass to 5 digits in total and remove trailing zeros
        const atomicMass = Number(Number(element.atomic_mass).toFixed(digitsAfterDecimal));


        return (
          <div
            key={element.number}
            className={styles.element}
            style={{
              gridColumn: element.col18Xpos,
              gridRow: element.col18Ypos,
            }}

          >
            <div className={styles.elementCardMedium}>
              <div className={styles.atomicNumber}>{element.number}</div>
              <div className={styles.symbol}>{element.symbol}</div>
              <div className={styles.name}>{element.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
