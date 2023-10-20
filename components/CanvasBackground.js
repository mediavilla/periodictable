// CanvasBackground.js

import React, { useEffect, useRef, useContext, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider'; // Import the context
import { getQuadrantColors, getAdjacentElements, getOffCanvasElements } from '../utils/getQuadrantColors';



const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    //    const { currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);
    const [isAnimating, setIsAnimating] = useState(false);

    let animationQueue = [];

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

        let animationQueue = []; // The animations in the queue that might happen if the user goes too fast will be killed

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

        // Initialize off-canvas squares individually with specific positions
        let offCanvasSquareOne = { x: 0, y: -(canvas.height / 2), color: 'purple' };
        let offCanvasSquareTwo = { x: canvas.width / 2, y: -(canvas.height / 2), color: 'orange' };


        function drawSquares() {
            console.log('Drawing squares');
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


        function executeAnimation() {
            // If an animation is already in progress, return
            if (isAnimating) return;

            if (animationQueue.length === 0) return;

            // Set the flag to true, indicating that an animation is in progress
            setIsAnimating(true);

            const direction = animationQueue.pop(); // Take the last item from the queue

            animationQueue = []; // Clear the queue

            move(direction); // Call your existing move function
        }

        // Your move function here

        function move(direction) {

            let adjacentElements = {};
            if (direction === 'up') {
                // offCanvasSquareOne bottom left & offCanvasSquareTwo bottom right
                offCanvasSquareOne.x = 0;
                offCanvasSquareTwo.x = canvas.width / 2;
                offCanvasSquareOne.y = canvas.height;
                offCanvasSquareTwo.y = canvas.height;
                adjacentElements = getAdjacentElements({ col18Xpos: currentElement.col18Xpos, col18Ypos: currentElement.col18Ypos + 1 }, elements);

            } else if (direction === 'down') {
                // offCanvasSquareOne top left & offCanvasSquareTwo top right
                offCanvasSquareOne.x = 0;
                offCanvasSquareTwo.x = canvas.width / 2;
                offCanvasSquareOne.y = -canvas.height / 2;
                offCanvasSquareTwo.y = -canvas.height / 2;
                adjacentElements = getAdjacentElements({ col18Xpos: currentElement.col18Xpos, col18Ypos: currentElement.col18Ypos - 1 }, elements);


            } else if (direction === 'left') {
                // offCanvasSquareOne top righ & offCanvasSquareTwo bottom right
                offCanvasSquareOne.x = canvas.width;
                offCanvasSquareTwo.x = canvas.width;
                offCanvasSquareOne.y = 0;
                offCanvasSquareTwo.y = canvas.height / 2;
                adjacentElements = getAdjacentElements({ col18Xpos: currentElement.col18Xpos - 1, col18Ypos: currentElement.col18Ypos }, elements);

            } else if (direction === 'right') {
                // offCanvasSquareOne top left & offCanvasSquareTwo bottom left
                offCanvasSquareOne.x = -canvas.width / 2;
                offCanvasSquareTwo.x = -canvas.width / 2;
                offCanvasSquareOne.y = 0;
                offCanvasSquareTwo.y = canvas.height / 2;
                adjacentElements = getAdjacentElements({ col18Xpos: currentElement.col18Xpos + 1, col18Ypos: currentElement.col18Ypos }, elements);

            }


            // Animate all squares (visible and off-canvas)
            const allSquares = squares.concat([offCanvasSquareOne, offCanvasSquareTwo]);
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

                // Log for debugging
                // console.log("From CanvasBackground - Elements:", elements);
                console.log("From CanvasBackground - Current Element:", currentElement);
                // Debugging: Check adjacent elements
                console.log("Adjacent Elements:", adjacentElements);

                // Animate squares
                anime({
                    targets: square,
                    x: targetX,
                    y: targetY,
                    duration: 500,
                    easing: 'linear',
                    update: drawSquares,
                    complete: function () {
                        // Filter squares that are within the visible canvas area
                        const visibleSquares = allSquares.filter(s => s && s.x >= 0 && s.x < canvas.width && s.y >= 0 && s.y < canvas.height);

                        // Get the new colors based on the current element
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
            executeAnimation();
        }
    }, [currentElement, prevCol18Xpos, prevCol18Ypos]);  // Removed isAnimating from dependency array


    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2, backgroundColor: 'white' }} />
    );
};

export default CanvasBackground;