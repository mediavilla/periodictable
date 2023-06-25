import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import elements from '../public/elements.json';
import timeline from '../public/timeline.json';
import TableLoader from '../components/TableLoader';
import Timeline from '../components/Timeline';
import TimelineContent from '../components/TimelineContent';
import styles from '../styles/timeline.module.css';
import getCategoryClassName from '../utils/getCategoryClassName';


const sortedTimeline = timeline.sort((a, b) => b.year - a.year);

function App() {



  const [selectedYear, setSelectedYear] = useState(null);

  function scrollToYear(year) {
    const section = document.getElementById(`${year}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setSelectedYear(year);
    }
  }


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
      <main>
        <div id="content">
          <TableLoader elements={elements} />

          <TimelineContent
            yearsData={sortedTimeline}
            elements={elements}
            getCategoryClassName={getCategoryClassName}
            selectedYear={selectedYear}
          />
          <div><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /></div>
        </div>

        <Timeline
          yearsData={sortedTimeline}
          onYearClick={scrollToYear}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        ></Timeline>

      </main>
    </>
  );
}

export default App;
