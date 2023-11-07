// CanvasBackground.js

import React, { useEffect, useContext, useRef, useState, useCallback } from 'react';
import { TableContext } from '../utils/TableProvider';
import { getAdjacentElements, getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {

    // ## I need time to think

    // #########################################################################################
    // #########################################################################################
    // Variables
    const canvasRef = useRef(null);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    // #########################################################################################
    // #########################################################################################
    // Function to draw the squares on the canvas
    const InitialVisibleSquares = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = windowSize.width || window.innerWidth;
        canvas.height = windowSize.height || window.innerHeight;

        console.log('InitialVisibleSquares Started');
        let squares = []; // Initialize an empty array to hold the squares

        if (elements && currentElement) {
            const { topLeftColor, topRightColor, bottomLeftColor, bottomRightColor } = getQuadrantColors(currentElement, elements);
            const squares = [
                { x: 0, y: 0, color: topLeftColor },
                { x: canvas.width / 2, y: 0, color: topRightColor },
                { x: 0, y: canvas.height / 2, color: bottomLeftColor },
                { x: canvas.width / 2, y: canvas.height / 2, color: bottomRightColor },
            ];
        }
        return squares; // Return the array of squares
    };

    console.log("SQUARES ARRAY: ", InitialVisibleSquares())
    console.log("CANVAS: getQuadrantColors", getQuadrantColors(currentElement, elements))
    console.log("CANVAS: getAdjacentElements", getAdjacentElements(currentElement, elements))


    // Render the canvas
    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
};

export default CanvasBackground;
