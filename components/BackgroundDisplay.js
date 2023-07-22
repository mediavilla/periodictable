import React from 'react';
import Bohr from './Bohr'; // This is your existing Bohr model component

// This component receives the currently selected element as a prop
function BackgroundDisplay({ element }) {
    // Check if an element has been selected
    if (!element) return null;

    // Return the Bohr model for the selected element
    // Adjust the styling as needed to fit your layout
    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}>

            <Bohr element={element} svgSize={800} />


        </div>
    );
}

export default BackgroundDisplay;
