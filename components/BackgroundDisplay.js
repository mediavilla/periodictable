import React from 'react';
import BohrBackground from './BohrBackground'; // This is your existing Bohr model component

// This component receives the currently selected element as a prop
function BackgroundDisplay({ element }) {
    // Check if an element has been selected
    if (!element) return null;

    // Return the Bohr model for the selected element
    // Adjust the styling as needed to fit your layout
    return (
        <>
            <BohrBackground element={element} />
        </>
    );
}

export default BackgroundDisplay;
