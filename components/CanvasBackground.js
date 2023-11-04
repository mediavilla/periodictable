// CanvasBackground.js

import React, { useEffect, useContext, useRef, useState } from 'react';
import { TableContext } from '../utils/TableProvider';
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {

    // #########################################################################################
    // #########################################################################################
    // Variables
    const canvasRef = useRef(null);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);
    const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
    const [isInitialized, setIsInitialized] = useState(false);
    const directionRef = useRef('');

    // #########################################################################################
    // #########################################################################################
    // Function to update the window size state
    const updateWindowSize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // #########################################################################################
    // #########################################################################################
    // useEffect to set the initial window size and setup resize event listener
    useEffect(() => {
        updateWindowSize();
        // Add event listener for window resize
        window.addEventListener('resize', updateWindowSize);
        // Cleanup function to remove the event listener
        return () => window.removeEventListener('resize', updateWindowSize);
    }, []);

    // #########################################################################################
    // #########################################################################################
    // Function to draw the squares on the canvas
    const drawSquares = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = windowSize.width || window.innerWidth;
        canvas.height = windowSize.height || window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (elements && currentElement) {
            const { topLeftColor, topRightColor, bottomLeftColor, bottomRightColor } = getQuadrantColors(currentElement, elements);
            const squares = [
                { x: 0, y: 0, color: topLeftColor },
                { x: canvas.width / 2, y: 0, color: topRightColor },
                { x: 0, y: canvas.height / 2, color: bottomLeftColor },
                { x: canvas.width / 2, y: canvas.height / 2, color: bottomRightColor },
            ];
            squares.forEach(square => {
                ctx.fillStyle = square.color;
                ctx.fillRect(square.x, square.y, canvas.width / 2, canvas.height / 2);
            });
        }
    };

    // #########################################################################################
    // #########################################################################################
    // useEffect for initial drawing of squares
    useEffect(() => {
        if (!isInitialized && windowSize.width && windowSize.height) {
            drawSquares();
            setIsInitialized(true);
        }
    }, [elements, currentElement]); // Only run this effect when elements or currentElement changes

    // #########################################################################################
    // #########################################################################################
    // Deternime direction
    const setDirection = () => {
        // Temporary variable to determine the new direction
        let newDirection = '';

        // Assuming currentElement is updated in the context when hovering over an element
        if (!currentElement) return;

        // Determine the direction based on currentElement and previous positions
        if (prevCol18Xpos !== null && prevCol18Ypos !== null) {
            if (prevCol18Xpos < currentElement.col18Xpos) {
                newDirection = 'right';
            } else if (prevCol18Xpos > currentElement.col18Xpos) {
                newDirection = 'left';
            } else if (prevCol18Ypos < currentElement.col18Ypos) {
                newDirection = 'down';
            } else if (prevCol18Ypos > currentElement.col18Ypos) {
                newDirection = 'up';
            }
        }
        // Update the ref with the new direction
        directionRef.current = newDirection;
    };

    // #########################################################################################
    // #########################################################################################
    // Get off-canvas squares in the right place with the right colors
    function offCanvasSquares() {
        const direction = directionRef.current; // Access the current direction value
        const canvas = canvasRef.current;
        console.log("offCanvasSquares DIRECTION: ", direction)

        let offCanvasSquareOne, offCanvasSquareTwo;

        if (direction === 'up') {
            offCanvasSquareOne = { x: 0, y: canvas.height };
            offCanvasSquareTwo = { x: canvas.width / 2, y: canvas.height };
        } else if (direction === 'down') {
            // offCanvasSquareOne top left & offCanvasSquareTwo top right
            offCanvasSquareOne = { x: 0, y: -canvas.height / 2 };
            offCanvasSquareTwo = { x: canvas.width / 2, y: -canvas.height / 2 }
        } else if (direction === 'right') {
            // offCanvasSquareOne top righ & offCanvasSquareTwo bottom right
            offCanvasSquareOne = { x: -canvas.width / 2, y: 0 };
            offCanvasSquareTwo = { x: -canvas.width / 2, y: canvas.height / 2 }
        } else if (direction === 'left') {
            // offCanvasSquareOne top left & offCanvasSquareTwo bottom left
            offCanvasSquareOne = { x: canvas.width, y: 0 };
            offCanvasSquareTwo = { x: canvas.width, y: canvas.height / 2 }
        }
        if (!offCanvasSquareOne || !offCanvasSquareTwo) {
            return []; // Return an empty array if squares are undefined
        }

        // Retrieve the colors
        const offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, direction);

        // Destructure colors from offCanvasElementsColors
        const { offCanvasSquareOneColor, offCanvasSquareTwoColor } = offCanvasElementsColors;

        // Return the squares directly, no need to check if they're undefined
        // as we initialized them as empty objects

        console.log("offCanvasSquares Off-Canvas Square One:", offCanvasSquareOne);
        console.log("offCanvasSquares Off-Canvas Square Two:", offCanvasSquareTwo);

        return [
            { x: offCanvasSquareOne.x, y: offCanvasSquareOne.y, color: offCanvasSquareOneColor },
            { x: offCanvasSquareTwo.x, y: offCanvasSquareTwo.y, color: offCanvasSquareTwoColor }
        ].filter(Boolean);  // Keep this to filter out if any object happens to be null or undefined
    }


    // #########################################################################################
    // #########################################################################################
    // useEffect that manages the sequesnce of events for 
    useEffect(() => {
        // Assuming handleHover is the function that updates the direction
        setDirection();
        offCanvasSquares();

    }, [currentElement]); // Only run this effect when currentElement changes


    // #########################################################################################
    // #########################################################################################
    // useEffect for handling window resize
    useEffect(() => {
        if (windowSize.width && windowSize.height) {
            drawSquares(); // Redraw squares when window size changes
        }
    }, [windowSize]); // Only run this effect when window size changes


    // #########################################################################################
    // #########################################################################################
    // Render the canvas
    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
};

export default CanvasBackground;
