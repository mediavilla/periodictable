import React, { useState, useEffect } from 'react';

const TimelineContent = ({ yearsData }) => {
    const [sections, setSections] = useState([]);

    useEffect(() => {
        const loadSections = async () => {
            const loadedSections = [];
            for (const { year, description } of yearsData) {
                try {
                    const { default: SectionComponent } = await import(`./TimelineYears/${year}`);
                    // console.log(`Loaded component for year ${year}`);
                    loadedSections.push(<SectionComponent key={year} description={description} />);
                } catch (error) {
                    console.error(`Failed to load section component for year ${year}:`, error);
                }
            }
            setSections(loadedSections);
        };

        loadSections();
    }, [yearsData]);

    return <>{sections}</>;
};

export default TimelineContent;
