// CanvasBackground.js
import React, { useEffect, useRef, useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial call to set size

        // Cleanup listener on unmount
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);



    // #########################################################################################
    // #########################################################################################
    // Function to get the inital squares
    const initialSQuares = () => {
        const canvas = canvasRef.current; // Define canvas from the ref
        const { topLeftColor, topRightColor, bottomLeftColor, bottomRightColor } = getQuadrantColors(currentElement, elements);
        if (canvas) {
            const squares = [
                { x: 0, y: 0, color: topLeftColor },
                { x: canvas.width / 2, y: 0, color: topRightColor },
                { x: 0, y: canvas.height / 2, color: bottomLeftColor },
                { x: canvas.width / 2, y: canvas.height / 2, color: bottomRightColor },
            ];
            return squares; // Return the array of squares
        }
        return []; // Return the array of squares
    };

    console.log("squares: ", initialSQuares())

    // Return the canvas element from the component
    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}
        />
    );
};

export default CanvasBackground;
