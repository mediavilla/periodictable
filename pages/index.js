import React, { useEffect } from 'react';
import Head from 'next/head';
import elements from '../public/elements.json';
import timeline from '../public/timeline.json';
import ElementsGrid from '../components/ElementsGrid';
import Timeline from '../components/Timeline';




function scrollToYear(year) {
  const section = document.getElementById(`${year}`);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

function updateSelectedYear(year) {
  const buttons = document.querySelectorAll('.timeline button');
  buttons.forEach((button) => {
    if (button.textContent === year) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });
}


export default function App() {
  useEffect(() => {
    // Attach the scroll event listener
    const handleScroll = () => {
      // Your scroll handling logic here
      const sections = document.querySelectorAll(".milestone-section");
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      for (const section of sections) {
        if (scrollTop >= section.offsetTop && scrollTop < section.offsetTop + section.offsetHeight) {
          // Update the selected year on the timeline
          updateSelectedYear(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up the event listener on unmount
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
        <Timeline yearsData={timeline} onYearClick={scrollToYear}></Timeline>

        <ElementsGrid elements={elements} />

        <section id="Today" className="milestone-section">
          <h2>2023</h2>
          <p>Here we go</p>
        </section>

        <section id="2020" className="milestone-section">
          <h2>2020</h2>
          <p>Here we go</p>
        </section>

        <section id="2010" className="milestone-section">
          <h2>2010</h2>
          <p>Here we go</p>
        </section>

        <section id="2000" className="milestone-section">
          <h2>2000</h2>
          <p>Here we go</p>
        </section>

        <section id="1990" className="milestone-section">
          <h2>1990</h2>
          <p>Here we go</p>
        </section>

        <section id="1980" className="milestone-section">
          <h2>1980</h2>
          <p>Here we go</p>
        </section>

        <section id="1970" className="milestone-section">
          <h2>1970</h2>
          <p>Here we go</p>
        </section>

        <section id="1960" className="milestone-section">
          <h2>1960</h2>
          <p>Here we go</p>
        </section>

      </main>
    </>
  )
}
