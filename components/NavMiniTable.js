import React from 'react'
import elementStyles from '../styles/periodicTable.module.css'
import Link from 'next/link'
import elementsData from '../public/elements.json'; // import your elements data
import getCategoryClassName from '../utils/getCategoryClassName';

export default function NavMiniTable() {
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
