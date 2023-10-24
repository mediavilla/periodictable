// CanvasBackground.js

import React, { useEffect, useRef, useContext, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider'; // Import the context
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    let animationQueue = []; // Move this line outside useEffect

    const [isAnimating, setIsAnimating] = useState(false);

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
                direction = 'left';
            } else if (prevCol18Xpos > currentElement.col18Xpos) {
                direction = 'right';
            }
        }

        if (currentElement && prevCol18Ypos !== null) {
            if (prevCol18Ypos < currentElement.col18Ypos) {
                direction = 'up';
            } else if (prevCol18Ypos > currentElement.col18Ypos) {
                direction = 'down';
            }
        }

        return direction;
    };


    useEffect(() => {

        // Only proceed if elements and currentElement are available
        if (!elements || !currentElement) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let topLeftColor, bottomLeftColor, topRightColor, bottomRightColor;
        let offCanvasSquareOne, offCanvasSquareTwo;

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


        function drawSquares() {
            console.log('Drawing squares');
            console.log('Drawing squares with colors:', squares.map(s => s.color));
            console.log('Current squares:', squares.map(s => s));
            console.log('Current offCanvasSquareOne:', offCanvasSquareOne);
            console.log('Current offCanvasSquareTwo:', offCanvasSquareTwo);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const allSquares = squares.concat([offCanvasSquareOne, offCanvasSquareTwo]);
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
            // If an animation is already in progress, return
            if (isAnimating) return;

            // Set the flag to true, indicating that an animation is in progress
            setIsAnimating(true);

            move(direction); // Call your existing move function
        }


        // Inside useEffect
        function startLastAnimation() {
            // Only proceed if the queue has items and no animation is in progress
            if (animationQueue.length === 0 || isAnimating) return;

            // Take the last item from the queue
            const lastDirection = animationQueue.pop();

            // Clear the queue
            animationQueue = [];

            // Start the animation
            executeAnimation(lastDirection);
        }


        // Your move function here

        function move(direction) {

            let adjacentElements = {};
            let offCanvasElementsColors = {};

            if (direction === 'up') {
                // offCanvasSquareOne bottom left & offCanvasSquareTwo bottom right
                if (offCanvasSquareOne) {
                    offCanvasSquareOne.x = 0;
                    offCanvasSquareOne.y = canvas.height;
                }
                if (offCanvasSquareTwo) {
                    offCanvasSquareTwo.x = canvas.width / 2;
                    offCanvasSquareTwo.y = canvas.height;
                }

                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "up");

            } else if (direction === 'down') {
                // offCanvasSquareOne top left & offCanvasSquareTwo top right
                if (offCanvasSquareOne) {
                    offCanvasSquareOne.x = 0;
                    offCanvasSquareOne.y = -canvas.height / 2;
                }
                if (offCanvasSquareTwo) {
                    offCanvasSquareTwo.x = canvas.width / 2;
                    offCanvasSquareTwo.y = -canvas.height / 2;
                }

                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "down");

            } else if (direction === 'right') {
                // offCanvasSquareOne top righ & offCanvasSquareTwo bottom right
                if (offCanvasSquareOne) {
                    offCanvasSquareOne.y = 0;
                    offCanvasSquareOne.x = canvas.width;
                }
                if (offCanvasSquareTwo) {
                    offCanvasSquareTwo.x = canvas.width;
                    offCanvasSquareTwo.y = canvas.height / 2;
                }

                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "right");

            } else if (direction === 'left') {
                // offCanvasSquareOne top left & offCanvasSquareTwo bottom left
                if (offCanvasSquareOne) {
                    offCanvasSquareOne.x = -canvas.width / 2;
                    offCanvasSquareOne.y = 0;
                }
                if (offCanvasSquareTwo) {
                    offCanvasSquareTwo.x = -canvas.width / 2;
                    offCanvasSquareTwo.y = canvas.height / 2;
                }

                offCanvasElementsColors = getOffCanvasSquaresColors(currentElement, elements, "left");
            }


            // Animate all squares (visible and off-canvas)
            const allSquares = squares.concat([offCanvasElementsColors]);
            allSquares.forEach(square => {

                let targetX = square.x;  // Initialize targetX
                let targetY = square.y;  // Initialize targetY

                if (direction === 'up') {
                    targetY -= canvas.height / 2;
                    console.log("GOING UP")
                } else if (direction === 'down') {
                    targetY += canvas.height / 2;
                    console.log("GOING DOWN")
                } else if (direction === 'left') {
                    targetX -= canvas.width / 2;
                    console.log("GOING LEFT")
                } else if (direction === 'right') {
                    targetX += canvas.width / 2;
                    console.log("GOING RIGHT")
                }


                // Animate squares
                anime({
                    targets: square,
                    x: targetX,
                    y: targetY,
                    duration: 2500,
                    easing: 'linear',
                    update: function () {
                        console.log('Animating square:', square);
                        drawSquares();
                    },
                    complete: function () {
                        // Filter squares that are within the visible canvas area
                        // const visibleSquares = allSquares.filter(s => s && s.x >= 0 && s.x < canvas.width && s.y >= 0 && s.y < canvas.height);

                        // Get the new colors based on the current element
                        /*
                        if (elements && currentElement) {
                            const { topLeftColor, bottomLeftColor, topRightColor, bottomRightColor } = (currentElement, elements, direction)

                            // Update the colors of the visible squares
                            squares.forEach((square, index) => {
                                if (index === 0) square.color = topLeftColor;
                                if (index === 1) square.color = topRightColor;
                                if (index === 2) square.color = bottomLeftColor;
                                if (index === 3) square.color = bottomRightColor;
                            });
                        }
                        */

                        // Set the flag to false, indicating that the animation is complete
                        setIsAnimating(false);

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
        }

    }, [currentElement, prevCol18Xpos, prevCol18Ypos]);  // Removed isAnimating from dependency array


    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2, backgroundColor: 'white' }} />
    );
};

export default CanvasBackground;