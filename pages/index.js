import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import elements from '../public/elements.json';
import timeline from '../public/timeline.json';
import ElementsGrid from '../components/ElementsGrid';
import Timeline from '../components/Timeline';
import TimelineContent from '../components/TimelineContent';

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
      console.log('Scroll event detected');
      const sections = document.querySelectorAll('.milestone-section');
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      for (const section of sections) {
        console.log('Section ID:', section.id);
        console.log('Section offsetTop:', section.offsetTop);
        console.log('ScrollTop:', scrollTop);
        console.log('Section offsetTop + section.offsetHeight:', section.offsetTop + section.offsetHeight);
        if (
          scrollTop + window.innerHeight / 2 >= section.offsetTop &&
          scrollTop + window.innerHeight / 2 < section.offsetTop + section.offsetHeight
        ) {

          console.log('Setting selected year:', section.id);
          setSelectedYear(section.id);

          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
        <Timeline
          yearsData={sortedTimeline}
          onYearClick={scrollToYear}
          selectedYear={selectedYear}
        ></Timeline>

        <ElementsGrid elements={elements} />

        <TimelineContent yearsData={sortedTimeline} />
      </main>
    </>
  );
}

export default App;
