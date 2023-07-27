import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import KeyboardArrowsNav from '../utils/KeyboardArrowsNav.js'
import elements from '../public/elements.json';
import timeline from '../public/timeline.json';
import { TableContext } from '../utils/TableProvider';
import TableSwitcher from '../components/TableSwitcher';
import Timeline from '../components/Timeline';
import TimelineContent from '../components/TimelineContent';
import styles from '../styles/timeline.module.css';
import getCategoryClassName from '../utils/getCategoryClassName';
import Table18 from '../components/Table18Cols'
import Table32 from '../components/Table32Cols'
import TableRaceTrack from '../components/TableRaceTrack'
import BohrBackground from '../components/BohrBackground'
import Footer from '../components/Footer'


const sortedTimeline = timeline.sort((a, b) => b.year - a.year);

function App() {

  const router = useRouter();
  const { currentElement, setCurrentElement } = useContext(TableContext);

  const [selectedYear, setSelectedYear] = useState(null);

  function scrollToYear(year) {
    const section = document.getElementById(`${year}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setSelectedYear(year);
    }
  }

  useEffect(() => {
    // invoke the function and save the returned function to a variable
    const cleanup = KeyboardArrowsNav(elements, currentElement, setCurrentElement, router);

    // call the returned function in the cleanup of the useEffect
    return cleanup;
  }, [elements, currentElement, setCurrentElement, router]);



  useEffect(() => {
    const handleScroll = () => {

      // console.log('Scroll event detected');      
      const sections = document.querySelectorAll('.milestone-section');
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      for (const section of sections) {
        // console.log('Section ID:', section.id);
        // console.log('Section offsetTop:', section.offsetTop);
        // console.log('ScrollTop:', scrollTop);
        // console.log('Section offsetTop + section.offsetHeight:', section.offsetTop + section.offsetHeight);
        if (
          scrollTop >= section.offsetTop &&
          scrollTop < section.offsetTop + section.offsetHeight
        ) {

          const links = document.querySelectorAll(`.${styles.timelineYears} li a`);
          const yearString = String(section.id); // Convert the year to a string

          const year = parseInt(section.id, 10); // Convert the section ID to a number
          setSelectedYear(year); // Update the selectedYear state

          // console.log('Setting selected year:', section.id);
          // console.log('LINKS:', links);
          // console.log('YEAR STRING', yearString);
          console.log('YEAR:', selectedYear)

          links.forEach((link) => {
            if (link.textContent === yearString) {
              link.classList.add(styles.selected);
              // console.log(`Adding style to year ${section.id}`);
            } else {
              link.classList.remove(styles.selected);
              // console.log(`Removing style to year ${section.id}`);
            }
          });
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [selectedYear]);

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

      <BohrBackground element={currentElement} />

      <main>

        <div id="content">
          <TableSwitcher
            elements={elements}
            TableComponent18={Table18}
            TableComponent32={Table32}
            TableComponentRaceTrack={TableRaceTrack}
          />

          <TimelineContent
            yearsData={sortedTimeline}
            elements={elements}
            getCategoryClassName={getCategoryClassName}
            selectedYear={selectedYear}
          />

        </div>

        <Timeline
          yearsData={sortedTimeline}
          onYearClick={scrollToYear}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        ></Timeline>

      </main>
      <Footer />

    </>
  );
}

export default App;
