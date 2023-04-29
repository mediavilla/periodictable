import React from 'react'
import elementStyles from '../styles/periodicTable.module.css'
import Link from 'next/link'

export default function ElementsGrid({ elements, getCategoryClassName }) {
  return (
    <section>
      <div className={elementStyles.periodicTable}>
        {elements.map((element) => {
          // console.log(element.col18Xpos, element.col18Ypos); // Log the properties

          // Calculate the number of digits before the decimal point
          const digitsBeforeDecimal = Math.floor(element.atomic_mass).toString().length;

          // Calculate the number of digits to display after the decimal point
          const digitsAfterDecimal = 4 - digitsBeforeDecimal;

          // Limit the atomic mass to 5 digits in total and remove trailing zeros
          const atomicMass = Number(Number(element.atomic_mass).toFixed(digitsAfterDecimal));


          return (
            <Link href={`/element/${element.name}`}
              key={element.number}
              className={`${elementStyles.element} ${getCategoryClassName(element.category)}`}
              style={{
                gridColumn: element.col18Xpos,
                gridRow: element.col18Ypos,
              }}

            >
              <div className={`${elementStyles.elementCardMedium}`}>
                <div className={elementStyles.atomicNumber}>{element.number}</div>
                <div className={elementStyles.symbol}>{element.symbol}</div>
                <div className={elementStyles.name}>{element.name}</div>
              </div>

            </Link>

          );
        })}
      </div>
    </section>
  );
}
