import React, { useEffect, useState } from 'react';
import elements from '../public/elements.json';
import timelineData from '../public/timeline.json';
import styles from '../styles/timeline.module.css';
import getCategoryClassName from '../utils/getCategoryClassName';
import TimelineSidebar from '../components/TimelineSidebar';
import TimelineContent from '../components/TimelineContent';
import Footer from '../components/Footer'

export default function timeline() {

    const sortedTimeline = timelineData.sort((a, b) => b.year - a.year);


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
            <main>

                <div id="content">

                    <TimelineContent
                        yearsData={sortedTimeline}
                        elements={elements}
                        getCategoryClassName={getCategoryClassName}
                        selectedYear={selectedYear}
                    />

                </div>

                <TimelineSidebar
                    yearsData={sortedTimeline}
                    onYearClick={scrollToYear}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                ></TimelineSidebar>

            </main>
            <Footer />

        </>

    );
}
