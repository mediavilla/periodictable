import React, { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import KeyboardArrowsNav from '../utils/KeyboardArrowsNav.js'
import elements from '../public/elements.json';
import { TableContext } from '../utils/TableProvider';
import TableSwitcher from '../components/TableSwitcher';
import NavTop from '../components/NavTop';
import Table18 from '../components/Table18Cols'
import Table32 from '../components/Table32Cols'
import TableRaceTrack from '../components/TableRaceTrack'
import BohrBackground from '../components/BohrBackground'
import Footer from '../components/Footer'


function App() {

  const router = useRouter();
  const { currentElement, setCurrentElement } = useContext(TableContext);

  KeyboardArrowsNav(currentElement, (key) => {
    let nextElement;

    switch (key) {
      case 'ArrowLeft':
        nextElement = elements.find(el => el.number === currentElement.number - 1);
        break;
      case 'ArrowRight':
        nextElement = elements.find(el => el.number === currentElement.number + 1);
        break;
      case 'ArrowUp':
        nextElement = elements.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos - 1);
        break;
      case 'ArrowDown':
        event.preventDefault(); // prevent the default scroll action
        nextElement = elements.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos + 1);
        break;
      default:
        break;
    }

    nextElement && setCurrentElement(nextElement);
  });


  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta
          name="description"
          content="The evolution of the periodic table and discovery of each element"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>


        <div id="content">
          <BohrBackground element={currentElement} />
          <NavTop />

          <TableSwitcher
            elements={elements}
            TableComponent18={Table18}
            TableComponent32={Table32}
            TableComponentRaceTrack={TableRaceTrack}
            setCurrentElement={setCurrentElement} // Pass setCurrentElement to TableSwitcher
          />


        </div>


      </main>
      <Footer />

    </>
  );
}

export default App;
