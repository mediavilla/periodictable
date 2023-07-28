import React, { useContext } from "react";
import Link from 'next/link';
import { TableContext } from '../utils/TableProvider';
import getCategoryClassName from '../utils/getCategoryClassName';
import elementStyles from '../styles/periodicTable.module.css'


export default function Table32({ elements }) {

  const { currentElement, setCurrentElement } = useContext(TableContext);


  // Return a default or fallback element when currentElement is null
  if (!currentElement) {
    return (
      <div className={elementStyles.element}>
        <span>No element selected</span>
      </div>
    );
  }

  return (
    <section>

      <div className={elementStyles.periodicTable32}>
        {elements.map((element) => {

          const isSelected = currentElement?.name === element.name;
          // console.log(element.col18Xpos, element.col18Ypos); // Log the properties

          // Calculate the number of digits before the decimal point
          const digitsBeforeDecimal = Math.floor(element.atomic_mass).toString().length;

          // Calculate the number of digits to display after the decimal point
          const digitsAfterDecimal = 4 - digitsBeforeDecimal;

          // Limit the atomic mass to 5 digits in total and remove trailing zeros
          const atomicMass = Number(Number(element.atomic_mass).toFixed(digitsAfterDecimal));


          return (

            <div className={`
            ${elementStyles.element} 
            ${getCategoryClassName(element.category, isSelected)}
            `}

              style={{
                gridColumn: element.col32Xpos,
                gridRow: element.col32Ypos,
              }}

              key={element.number} // Add the key prop here

            >
              <Link href={`/${element.name}`} key={element.number}>

                <div className={`${elementStyles.elementCardMedium}`} onMouseEnter={() => setCurrentElement(element)}>
                  <div className={elementStyles.atomicNumber}>{element.number}</div>
                  <div className={elementStyles.symbol}>{element.symbol}</div>
                  <div className={elementStyles.name}>{element.name}</div>
                </div>

              </Link>
            </div>

          );
        })}
      </div>



    </section>
  );
}
