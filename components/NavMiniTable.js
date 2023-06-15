import { useContext } from 'react'
import Link from 'next/link'
import { TableContext } from '../utils/TableProvider';
import elementsData from '../public/elements.json'; // import your elements data
import elementStyles from '../styles/periodicTable.module.css'
import getCategoryClassName from '../utils/getCategoryClassName';

export default function NavMiniTable(element) {

  const { currentElement } = useContext(TableContext);

  console.log("H CURRENT ELEMENT", currentElement)
  console.log("H  ELEMENT", element)

  if (currentElement === null) {
    <p>loading...</p>
    return null;
  }

  return (
    <div className={elementStyles.periodicTable}>
      {elementsData.map((element) => {
        return (
          <Link href={`/${element.name}`}
            key={element.number}

            className={`${elementStyles.element} ${getCategoryClassName(element.category)}`}
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
