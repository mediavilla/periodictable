import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import elements from '../public/elements.json';
import timeline from '../public/timeline.json';
import ElementsGrid from '../components/ElementsGrid';
import Timeline from '../components/Timeline';
import TimelineContent from '../components/TimelineContent';

// Sort the timeline data in descending order based on the year
const sortedTimeline = timeline.sort((a, b) => b.year - a.year);

function scrollToYear(year) {
  const section = document.getElementById(`${year}`);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}


export default function App() {

  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {

    const handleScroll = () => {
      // Your scroll handling logic here
      const sections = document.querySelectorAll(".milestone-section");
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const middleScreenPosition = scrollTop + (window.innerHeight / 2);

      for (const section of sections) {
        if (middleScreenPosition >= section.offsetTop && middleScreenPosition < section.offsetTop + section.offsetHeight) {
          // Update the selected year
          setSelectedYear(section.id);
          break;
        }
      }
    };






    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="The evolution of the periodic table and disovery of each element" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Timeline yearsData={sortedTimeline} onYearClick={scrollToYear} selectedYear={selectedYear}></Timeline>

        <ElementsGrid elements={elements} />

        <TimelineContent yearsData={sortedTimeline} />

      </main>
    </>
  )
}
