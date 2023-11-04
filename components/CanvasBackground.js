// CanvasBackground.js

import React, { useEffect, useContext, useRef, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider'; // Import the context
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const { elements, currentElement } = useContext(TableContext);
    const [isInitialized, setIsInitialized] = useState(false);

    // useEffect that runs only once to get the backghround squares colors on page load
    // Effect to update squares state when currentElement and elements are available
    // #####################################################        
    useEffect(() => {
        if (elements && currentElement && !isInitialized) {

            console.log("USEEFFECT IF WORKING")

            // Variables to setup the canvas
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Variables to get the squares colors
            const { topLeftColor, topRightColor, bottomLeftColor, bottomRightColor } = getQuadrantColors(currentElement, elements);

            // Canvas sizing
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            console.log("topLeftColor: ", topLeftColor)

            // Assign colors and positions to the initial squares
            const InitialSquares = [
                { x: 0, y: 0, color: topLeftColor },
                { x: window.innerWidth / 2, y: 0, color: topRightColor },
                { x: 0, y: window.innerHeight / 2, color: bottomLeftColor },
                { x: window.innerWidth / 2, y: window.innerHeight / 2, color: bottomRightColor }
            ];

            // Iterate over each square to draw them in the canvas
            InitialSquares.forEach(square => {
                // console.log('Square:', square);
                if (square) {  // Check if square is not undefined
                    ctx.fillStyle = square.color;
                    ctx.fillRect(square.x, square.y, canvas.width / 2, canvas.height / 2);
                }
            });
            // Set isInitialized to true so this useEffect only runs once
            setIsInitialized(true);
        }
    }, [elements, currentElement, isInitialized]);




    // Render the canvas
    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
};

export default CanvasBackground;
