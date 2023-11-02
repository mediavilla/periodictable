// CanvasBackground.js

import React, { useEffect, useRef, useContext, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider'; // Import the context
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const [squares, setSquares] = useState([]); // This will hold both visible and off-canvas squares
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);
    let topLeftColor, bottomLeftColor, topRightColor, bottomRightColor;


    // #####################################################
    // #####################################################
    // #####################################################
    // This function should be called before starting the animation
    const prepareOffCanvasSquares = (direction) => {
        const canvas = canvasRef.current;
        let offCanvasSquareOne, offCanvasSquareTwo;

        // Make sure to use the canvas dimensions from the ref
        // and return the prepared off-canvas squares
        console.log("offCanvasSquares: ", direction)

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


    };


    // #####################################################
    // #####################################################
    // #####################################################
    // Initialize the canvas and context
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Placeholder for initializing squares with default colors or transparent
        const initialSquares = [
            { x: 0, y: 0, color: 'transparent' },
            { x: canvas.width / 2, y: 0, color: 'transparent' },
            { x: 0, y: canvas.height / 2, color: 'transparent' },
            { x: canvas.width / 2, y: canvas.height / 2, color: 'transparent' }
        ];
        setSquares(initialSquares);

        // Function to draw squares
        const drawSquares = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            initialSquares.forEach(square => {
                ctx.fillStyle = square.color;
                ctx.fillRect(square.x, square.y, canvas.width / 2, canvas.height / 2);
            });
        };

        drawSquares();
    }, []); // Empty dependency array means this runs once on mount


    // #####################################################
    // #####################################################
    // #####################################################
    // Update colors when elements or currentElement change
    useEffect(() => {
        if (elements && currentElement) {
            const { topLeftColor, bottomLeftColor, topRightColor, bottomRightColor } = getQuadrantColors(currentElement, elements);
            // Update the colors of the squares
            setSquares(squares => squares.map((square, index) => {
                switch (index) {
                    case 0: return { ...square, color: topLeftColor };
                    case 1: return { ...square, color: topRightColor };
                    case 2: return { ...square, color: bottomLeftColor };
                    case 3: return { ...square, color: bottomRightColor };
                    default: return square;
                }
            }));
        }
    }, [elements, currentElement]); // Dependencies on elements and currentElement






    // Method to handle hover events
    // #####################################################
    // #####################################################
    // #####################################################
    const handleHover = () => {
        // Assuming currentElement is updated in the context when hovering over an element
        if (!currentElement) return;

        // Determine the direction based on currentElement and previous positions
        let direction;
        if (prevCol18Xpos !== null && prevCol18Ypos !== null) {
            if (prevCol18Xpos < currentElement.col18Xpos) {
                direction = 'right';
            } else if (prevCol18Xpos > currentElement.col18Xpos) {
                direction = 'left';
            } else if (prevCol18Ypos < currentElement.col18Ypos) {
                direction = 'down';
            } else if (prevCol18Ypos > currentElement.col18Ypos) {
                direction = 'up';
            }
        }

        // Determine the off-canvas squares based on the direction
        // This is a placeholder, you'll need to implement the logic based on your application's needs
        const offCanvasSquares = prepareOffCanvasSquares(direction, currentElement, elements);

        // Start the animation with the determined direction and off-canvas squares
        animateSquares(direction, offCanvasSquares);
    };

    // #####################################################
    // #####################################################
    // #####################################################
    // You would call handleHover in a useEffect that depends on currentElement
    useEffect(() => {
        handleHover();
    }, [currentElement]); // Re-run the effect when currentElement changes


    // Animation logic
    const animateSquares = (direction, offCanvasSquares) => {
        // Define the animation targets
        const targets = squares.concat(offCanvasSquares);

        // Define the animation properties based on direction
        let animationProperties;
        switch (direction) {
            case 'up':
                animationProperties = { translateY: '-=canvas.height / 2' };
                break;
            case 'down':
                animationProperties = { translateY: '+=canvas.height / 2' };
                break;
            case 'left':
                animationProperties = { translateX: '-=canvas.width / 2' };
                break;
            case 'right':
                animationProperties = { translateX: '+=canvas.width / 2' };
                break;
            default:
                // If direction is not defined, we don't want to run the animation
                return;
        }


        // #####################################################
        // #####################################################
        // #####################################################
        // Run the animation with anime.js
        anime({
            targets: targets,
            ...animationProperties,
            easing: 'easeOutQuad',
            duration: 1000, // Duration in milliseconds
            complete: function (anim) {
                // Once the animation is complete, update the state with new positions and colors
                // You'll need to calculate the new positions based on the animation
                // For example, if the direction is 'up', you'll subtract canvas.height / 2 from the y position of each square
                const newSquares = targets.map(square => {
                    // Calculate new position based on direction
                    // This is a placeholder, you'll need to implement the logic based on your application's needs
                    return {
                        ...square,
                        y: square.y - (direction === 'up' ? canvas.height / 2 : 0), // Example for 'up' direction
                        // Add similar calculations for x and y based on other directions
                    };
                });

                // Update the squares state with the new squares
                setSquares(newSquares);
            }
        });
    };
    // Render the canvas
    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
};

export default CanvasBackground;
