import { useContext } from 'react'
import Link from 'next/link'
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json'; // import your elements data
import elementStyles from '../styles/periodicTable.module.css'
import getCategoryClassName from '../utils/getCategoryClassName';

export default function NavMiniTable(element) {


  const { currentElement, loading } = useContext(TableContext);

  if (loading) {
    return <p>Loading...</p>; // or any other placeholder component
  }

  // Rest of your component
  console.log("H CURRENT ELEMENT", currentElement)
  console.log("H  ELEMENT", element)

  return (
    <div className={elementStyles.periodicTable}>
      {elementsData.map((element) => {
        return (
          <Link href={`/${element.name}`}
            key={element.number}

            className={`
                ${elementStyles.element} 
                ${getCategoryClassName(element.category)} 
                ${currentElement && currentElement.name === element.name ? 'selected' : ''}
            `}

            style={{
              gridColumn: element.col18Xpos,
              gridRow: element.col18Ypos,
            }}

          >

          </Link>

        );
      })}
    </div>
  );
}
