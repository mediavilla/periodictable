// CanvasBackground.js

import React, { useEffect, useRef, useContext, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider'; // Import the context
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    // Create a ref to keep track of whether this is the first update
    const isFirstUpdate = useRef(true);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    let animationQueue = []; // Move this line outside useEffect

    const [isAnimating, setIsAnimating] = useState(false);


    let offCanvasSquareOne = {};  // Initialize to empty object
    let offCanvasSquareTwo = {};  // Initialize to empty object
    let offCanvasElementsColors = {};


    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }, []);


    // Event listeners for direction (use the context values)

    const getDirection = () => {
        let direction = null;

        if (currentElement && prevCol18Xpos !== null) {
            if (prevCol18Xpos < currentElement.col18Xpos) {
                direction = 'right';
            } else if (prevCol18Xpos > currentElement.col18Xpos) {
                direction = 'left';
            }
        }

        if (currentElement && prevCol18Ypos !== null) {
            if (prevCol18Ypos < currentElement.col18Ypos) {
                direction = 'down';
            } else if (prevCol18Ypos > currentElement.col18Ypos) {
                direction = 'up';
            }
        }

        return direction;
    };

    const [movementDirection, setMovementDirection] = useState(null);

    const updateMovementDirection = (newDirection) => {
        setMovementDirection(newDirection);
    };

    useEffect(() => {
        console.log('###################### Effect Start');

        // Only proceed if elements and currentElement are available
        if (!elements || !currentElement) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let topLeftColor, bottomLeftColor, topRightColor, bottomRightColor;

        // Get quadrant colors based on the current element and elements array

        if (elements && currentElement) {
            ({ topLeftColor, bottomLeftColor, topRightColor, bottomRightColor } = getQuadrantColors(currentElement, elements));
        }


        let squares = [
            { x: 0, y: 0, color: topLeftColor },
            { x: canvas.width / 2, y: 0, color: topRightColor },
            { x: 0, y: canvas.height / 2, color: bottomLeftColor },
            { x: canvas.width / 2, y: canvas.height / 2, color: bottomRightColor }
        ];
        console.log("topLeftColor: ", topLeftColor)
        console.log("topRightColor: ", topRightColor)
        console.log("bottomLeftColor: ", bottomLeftColor)
        console.log("bottomRightColor: ", bottomRightColor)


        function offCanvasSquares(direction) {
            console.log("offCanvasSquares: ", direction)

            if (direction === 'up') {
                offCanvasSquareOne = { x: 0, y: canvas.height };
                offCanvasSquareTwo = { x: canvas.width / 2, y: canvas.height };
                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "up");

            } else if (direction === 'down') {
                // offCanvasSquareOne top left & offCanvasSquareTwo top right
                offCanvasSquareOne = { x: 0, y: -canvas.height / 2 };
                offCanvasSquareTwo = { x: canvas.width / 2, y: -canvas.height / 2 }
                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "down");

            } else if (direction === 'right') {
                // offCanvasSquareOne top righ & offCanvasSquareTwo bottom right
                offCanvasSquareOne = { x: -canvas.width / 2, y: 0 };
                offCanvasSquareTwo = { x: -canvas.width / 2, y: canvas.height / 2 }
                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "right");

            } else if (direction === 'left') {
                // offCanvasSquareOne top left & offCanvasSquareTwo bottom left
                offCanvasSquareOne = { x: canvas.width, y: 0 };
                offCanvasSquareTwo = { x: canvas.width, y: canvas.height / 2 }
                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "left");
            }

            if (!offCanvasSquareOne || !offCanvasSquareTwo) {
                return []; // Return an empty array if squares are undefined
            }

            // Retrieve the colors
            offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, direction);

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


        function drawSquares() {
            // console.log('Drawing squares with colors:', squares.map(s => s.color));
            // console.log('Current squares:', squares.map(s => s));
            // console.log('drawSquares Current offCanvasSquareOne:', offCanvasSquareOne);
            // console.log('drawSquares Current offCanvasSquareTwo:', offCanvasSquareTwo);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const allSquares = squares.concat([offCanvasSquareOne, offCanvasSquareTwo]);
            console.log("ALL SQUARES: ", allSquares)
            allSquares.forEach(square => {
                // console.log('Square:', square);
                if (square) {  // Check if square is not undefined
                    ctx.fillStyle = square.color;
                    ctx.fillRect(square.x, square.y, canvas.width / 2, canvas.height / 2);
                }
            });
        }


        // Inside useEffect
        function executeAnimation(direction) {
            console.log("executeAnimation: ", direction)
            // If an animation is already in progress, return
            if (isAnimating) return;

            // Set the flag to true, indicating that an animation is in progress
            setIsAnimating(true);

            move(direction); // Call your existing move function
        }


        // Inside useEffect
        function startLastAnimation() {
            console.log("startLastAnimation: ")
            // Only proceed if the queue has items and no animation is in progress
            if (animationQueue.length === 0 || isAnimating) return;

            // Take the last item from the queue
            const lastDirection = animationQueue.pop();

            // Clear the queue
            animationQueue = [];
            console.log("startLastAnimation lastDirection: ", lastDirection)
            // Start the animation
            executeAnimation(lastDirection);
        }



        // MOVE SQUARES

        function move(direction) {
            console.log("FUNCTION MOVE: ", direction)
            // Get the off-canvas squares
            const offCanvas = offCanvasSquares(direction);
            console.log("offCanvas move function", offCanvas)

            // Animate all squares (visible and off-canvas)
            const allSquares = [...squares, ...offCanvas];
            console.log("allSquares move function", allSquares)

            allSquares.forEach(square => {
                let targetX = square.x;  // Initialize targetX
                let targetY = square.y;  // Initialize targetY

                if (direction === 'down') {
                    targetY -= canvas.height / 2;
                } else if (direction === 'up') {
                    targetY += canvas.height / 2;
                } else if (direction === 'right') {
                    targetX -= canvas.width / 2;
                } else if (direction === 'left') {
                    targetX += canvas.width / 2;
                }

                // Animate squares
                anime({
                    targets: square,
                    x: targetX,
                    y: targetY,
                    duration: 2500,
                    easing: 'linear',
                    update: function () {
                        drawSquares();
                        console.log("ANIME UPDATE")
                    },
                    complete: function () {
                        // Set the flag to false, indicating that the animation is complete
                        setIsAnimating(false);

                        console.log("MOVE COMPLETE")

                        // Update the squares array with new positions
                        squares = allSquares.map(s => {
                            return {
                                x: s.x,
                                y: s.y,
                                color: s.color
                            };
                        });
                        // Update offCanvasSquareOne and offCanvasSquareTwo with new positions and colors
                        const offCanvasUpdated = allSquares.slice(-2); // last two items should be offCanvasSquares
                        offCanvasSquareOne = offCanvasUpdated[0];
                        offCanvasSquareTwo = offCanvasUpdated[1];
                    }
                });
            });
        }


        // Draw squares initially
        drawSquares();

        const direction = getDirection(); // Get the direction based on the context values
        if (direction && !isAnimating) {  // Check if not currently animating
            animationQueue.push(direction);
            startLastAnimation();
            console.log("CONDITIONAL DIRECTION MOVE")
        }
        console.log('###################### Effect End');
    }, [currentElement]);  // Removed isAnimating from dependency array


    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2, backgroundColor: 'white' }} />
    );
};

export default CanvasBackground;