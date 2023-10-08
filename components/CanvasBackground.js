// CanvasBackground.js

import React, { useEffect, useRef, useContext, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider'; // Import the context

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const { currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);
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


    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let animationQueue = []; // The animations in the queue that might happen if the user goes too fast will be killed

        // Initialize four squares with different colors and positions
        let squares = [
            { x: 0, y: 0, color: 'red' },
            { x: canvas.width / 2, y: 0, color: 'blue' },
            { x: 0, y: canvas.height / 2, color: 'green' },
            { x: canvas.width / 2, y: canvas.height / 2, color: 'yellow' }
        ];

        // Initialize off-canvas squares individually with specific positions
        let offCanvasSquareOne = { x: 0, y: -(canvas.height / 2), color: 'purple' };
        let offCanvasSquareTwo = { x: canvas.width / 2, y: -(canvas.height / 2), color: 'orange' };

        // Debugging: Log initial positions of off-canvas squares
        console.log("Initial offCanvasSquareOne:", offCanvasSquareOne);
        console.log("Initial offCanvasSquareTwo:", offCanvasSquareTwo);

        // Your drawSquares function here

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

        // Your executeAnimation function here

        function executeAnimation() {
            // If an animation is already in progress, return
            if (isAnimating) return;

            console.log("ANIMATION NOT IN QUEUE");
            if (animationQueue.length === 0) return;
            console.log("ANIMATION IN QUEUE: ", animationQueue);

            // Set the flag to true, indicating that an animation is in progress
            setIsAnimating(true);

            const direction = animationQueue.pop(); // Take the last item from the queue
            animationQueue = []; // Clear the queue

            move(direction); // Call your existing move function
        }

        // Your move function here

        function move(direction) {
            // Debugging: Log positions of off-canvas squares during animation
            console.log("During Animation offCanvasSquareOne:", offCanvasSquareOne);
            console.log("During Animation offCanvasSquareTwo:", offCanvasSquareTwo);

            // Set initial positions for off-canvas squares based on direction
            if (direction === 'up') {
                console.log("UP BUTTON PRESSED")
                offCanvasSquareOne.x = 0;
                offCanvasSquareTwo.x = canvas.width / 2;
                offCanvasSquareOne.y = canvas.height;
                offCanvasSquareTwo.y = canvas.height;
            } else if (direction === 'down') {
                console.log("DOWN BUTTON PRESSED")
                offCanvasSquareOne.x = 0;
                offCanvasSquareTwo.x = canvas.width / 2;
                offCanvasSquareOne.y = -canvas.height / 2;
                offCanvasSquareTwo.y = -canvas.height / 2;
            } else if (direction === 'left') {
                console.log("LEFT BUTTON PRESSED")
                offCanvasSquareOne.x = canvas.width;
                offCanvasSquareTwo.x = canvas.width;
                offCanvasSquareOne.y = 0;
                offCanvasSquareTwo.y = canvas.height / 2;
            } else if (direction === 'right') {
                console.log("RIGHT BUTTON PRESSED")
                offCanvasSquareOne.x = -canvas.width / 2;
                offCanvasSquareTwo.x = -canvas.width / 2;
                offCanvasSquareOne.y = 0;
                offCanvasSquareTwo.y = canvas.height / 2;
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

                        // Filter squares that are outside the visible canvas area
                        const offCanvasSquares = allSquares.filter(s => s && (s.x < 0 || s.x >= canvas.width || s.y < 0 || s.y >= canvas.height));

                        // Update the squares and off-canvas queue
                        squares = visibleSquares;

                        // Sort off-canvas squares by their x and y positions
                        offCanvasSquares.sort((a, b) => a.x - b.x || a.y - b.y);

                        // Update offCanvasSquareOne and offCanvasSquareTwo
                        offCanvasSquareOne = offCanvasSquares[0];
                        offCanvasSquareTwo = offCanvasSquares[1];

                        // Set the flag to false, indicating that the animation is complete
                        setIsAnimating(false);

                        // Debugging: Log positions of off-canvas squares after animation
                        console.log("After Animation offCanvasSquareOne:", offCanvasSquareOne);
                        console.log("After Animation offCanvasSquareTwo:", offCanvasSquareTwo);

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
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2, backgroundColor: 'grey' }} />
    );
};

export default CanvasBackground;
