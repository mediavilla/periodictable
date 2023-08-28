import React, { useContext } from "react";
import Link from 'next/link';
import { TableContext } from '../utils/TableProvider';
import getCategoryClassName from '../utils/getCategoryClassName';
import getCategoryHexColor from '../utils/getCategoryHexColor';
import elementStyles from '../styles/periodicTable.module.css'


export default function Table18({ elements }) {

  const { currentElement, setCurrentElement } = useContext(TableContext);


  // Return a default or fallback element when currentElement is null
  if (!currentElement) {
    return (
      <div className={elementStyles.element}>
        <span>No element selected</span>
      </div>
    );
  }

  function getAdjacentElements(currentElement, elements) {
    const xPos = currentElement.col18Xpos;
    const yPos = currentElement.col18Ypos;

    const topLeftElement = currentElement;
    const bottomLeftElement = elements.find(el => el.col18Xpos === xPos && el.col18Ypos === yPos + 1);
    const topRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos);
    const bottomRightElement = elements.find(el => el.col18Xpos === xPos + 1 && el.col18Ypos === yPos + 1);

    return { topLeftElement, bottomLeftElement, topRightElement, bottomRightElement };
  }



  function updateBackgroundGradient(adjacentElements) {
    const topLeftColor = getCategoryHexColor(adjacentElements.topLeftElement.category);
    const bottomLeftColor = adjacentElements.bottomLeftElement ? getCategoryHexColor(adjacentElements.bottomLeftElement.category) : '#efefef';
    const topRightColor = adjacentElements.topRightElement ? getCategoryHexColor(adjacentElements.topRightElement.category) : '#efefef';
    const bottomRightColor = adjacentElements.bottomRightElement ? getCategoryHexColor(adjacentElements.bottomRightElement.category) : '#efefef';

    const gradient = `conic-gradient(from 1.5708rad at 50% 50%, ${topLeftColor} 9%, ${topRightColor} 41%, ${bottomRightColor} 51%, ${bottomLeftColor} 92%)`;
    document.documentElement.style.backgroundImage = gradient;
  }



  return (
    <section>

      <div className={elementStyles.periodicTable18}>
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
                gridColumn: element.col18Xpos,
                gridRow: element.col18Ypos,
              }}

              key={element.number} // Add the key prop here

            >
              <Link
                href={`/${element.name}`}
                key={element.number}
                className={`${elementStyles.elementCardMedium}`}
                onMouseEnter={() => {
                  setCurrentElement(element);
                  const adjacentElements = getAdjacentElements(element, elements);
                  updateBackgroundGradient(adjacentElements);
                }}

              >


                <div className={elementStyles.atomicNumber}>{element.number}</div>
                <div className={elementStyles.symbol}>{element.symbol}</div>
                <div className={elementStyles.name}>{element.name}</div>


              </Link>
            </div>

          );
        })}
      </div>



    </section>
  );
}
