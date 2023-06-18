import { useContext } from 'react'
import Link from 'next/link'
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json'; // import your elements data
import elementStyles from '../styles/periodicTable.module.css'
import getCategoryClassName from '../utils/getCategoryClassName';

export default function NavMiniTable() {

  const { currentElement, loading } = useContext(TableContext);

  console.log("### Current Element in NavMiniTable", currentElement)

  if (loading) {
    return <p>Loading...</p>; // or any other placeholder component
  }

  // Return a default or fallback element when currentElement is null
  if (!currentElement) {
    return (
      <div className={elementStyles.element}>
        <span>No element selected</span>
      </div>
    );
  }

  return (
    <section className={elementStyles.NavMiniTable}>
      <div className={elementStyles.periodicTableMini}>
        {elementsData.map((element) => {
          const isSelected = currentElement?.name === element.name;

          return (
            <Link href={`/${element.name}`}
              key={element.number}

              className={`
            ${elementStyles.element} 
            ${getCategoryClassName(element.category, isSelected)}
            `}


              style={{
                gridColumn: element.col18Xpos,
                gridRow: element.col18Ypos,
              }}

            >

            </Link>

          );
        })}
      </div >
    </section>
  );
}
