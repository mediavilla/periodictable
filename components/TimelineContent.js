import React, { useState, useEffect } from 'react';

const TimelineContent = ({ yearsData, elements, getCategoryClassName, selectedYear }) => {
    const [sections, setSections] = useState([]);
    // console.log('TimelineContent component rendered with selectedYear:', selectedYear);


    useEffect(() => {
        const loadSections = async () => {
            const loadedSections = [];
            for (const { year, description } of yearsData) {
                try {
                    const { default: SectionComponent } = await import(`./TimelineYears/${year}`);
                    // console.log(`Loaded component for year ${year}`);
                    loadedSections.push(
                        <SectionComponent key={year}
                            description={description}
                            elements={elements}
                            getCategoryClassName={getCategoryClassName}
                            selectedYear={selectedYear}
                        />);
                } catch (error) {
                    console.error(`Failed to load section component for year ${year}:`, error);
                }
            }
            setSections(loadedSections);
        };

        loadSections();
    }, [yearsData, selectedYear]); // Add selectedYear to the dependency array


    return <>{sections}</>;
};

export default TimelineContent;
