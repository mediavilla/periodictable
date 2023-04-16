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

        function getCategoryClassName(category) {
          const categoryClassMap = {
            // Add other category mappings here
            'diatomic nonmetal': styles.reactiveNonMetals,
            'polyatomic nonmetal': styles.reactiveNonMetals,
            'alkali metal': styles.AlkaliMetals,
            'alkaline earth metal': styles.AlkalineEarthMetals,
            'transition metal': styles.TransitionMetals,
            'lanthanide': styles.lanthanide,
            'lanthanide lanthanum': styles.lanthanum,
            'actinide': styles.actinide,
            'actinide actinium': styles.actinium,
            'post-transition metal': styles.postTransitionMetal,
            'metalloid': styles.metalloid,
            'noble gas': styles.nobleGas,
            'unknown probably transition metal': styles.unknownProperties,
            'unknown probably post-transition metal': styles.unknownProperties,
            'unknown probably metalloid': styles.unknownProperties,
            'unknown predicted to be noble gas': styles.unknownProperties
          };

          return categoryClassMap[category] || '';
        }

        return (
          <div
            key={element.number}
            className={`${styles.element} ${element.category} ${getCategoryClassName(element.category)}`}
            style={{
              gridColumn: element.col18Xpos,
              gridRow: element.col18Ypos,
            }}

          >
            <div className={`${styles.elementCardMedium}`}>
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
