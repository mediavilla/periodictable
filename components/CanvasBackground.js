// CanvasBackground.jsx
import React, { useRef, useEffect, useContext, useState } from 'react';
import { TableContext } from '../utils/TableProvider';

function CanvasBackground({ colors = {} }) {
    const canvasRef = useRef(null);

    const [rectangles, setRectangles] = useState([]); // To store the six rectangles NOT SURE IF I NEED THIS

    const { currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    // Step 1: Move rectangle position variables outside of useEffect
    // Step 2: Use useState to manage positions
    const [topLeft, setTopLeft] = useState({ x: 0, y: 0 });
    const [topRight, setTopRight] = useState({ x: 0, y: 0 }); // Initialize properly later
    const [bottomLeft, setBottomLeft] = useState({ x: 0, y: 0 }); // Initialize properly later
    const [bottomRight, setBottomRight] = useState({ x: 0, y: 0 }); // Initialize properly later

    // Define off-canvas rectangles
    const [offCanvasTopLeft, setOffCanvasTopLeft] = useState({ x: 0, y: 0 }); // Initialize properly later
    const [offCanvasTopRight, setOffCanvasTopRight] = useState({ x: 0, y: 0 }); // Initialize properly later
    const [offCanvasBottomLeft, setOffCanvasBottomLeft] = useState({ x: 0, y: 0 }); // Initialize properly later
    const [offCanvasBottomRight, setOffCanvasBottomRight] = useState({ x: 0, y: 0 }); // Initialize properly later

    // Function to determine the direction of mouse movement

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


    // Function to animate the rectangles
    const animate = (direction) => {
        // Animation logic here
        // You'll update the x and y positions of all rectangles based on the direction
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;


        // Initialize positions if they are at (0, 0)
        if (topLeft.x === 0 && topLeft.y === 0) {
            setTopLeft({ x: 0, y: 0 });
            setTopRight({ x: canvas.width / 2, y: 0 });
            setBottomLeft({ x: 0, y: canvas.height / 2 });
            setBottomRight({ x: canvas.width / 2, y: canvas.height / 2 });

            setOffCanvasTopLeft({ x: 0, y: -canvas.height });
            setOffCanvasTopRight({ x: canvas.width / 2, y: -canvas.height });
            setOffCanvasBottomLeft({ x: 0, y: canvas.height * 2 });
            setOffCanvasBottomRight({ x: canvas.width / 2, y: canvas.height * 2 });
        }
        // Determine the direction of movement
        const direction = getDirection();

        // Update positions based on direction
        if (direction) {
            updateRectanglePositions(direction, topLeft, topRight, bottomLeft, bottomRight, offCanvasTopLeft, offCanvasTopRight, offCanvasBottomLeft, offCanvasBottomRight, canvas);
        }

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply blur filter
        ctx.filter = 'blur(150px)';

        // Draw the rectangles based on passed colors

        if (colors.topLeftColor) {
            ctx.fillStyle = colors.topLeftColor;
            ctx.fillRect(topLeft.x, topLeft.y, canvas.width / 2, canvas.height / 2);
        }

        if (colors.bottomLeftColor) {
            ctx.fillStyle = colors.bottomLeftColor;
            ctx.fillRect(bottomLeft.x, bottomLeft.y, canvas.width / 2, canvas.height / 2);
        }

        if (colors.topRightColor) {
            ctx.fillStyle = colors.topRightColor;
            ctx.fillRect(topRight.x, topRight.y, canvas.width / 2, canvas.height / 2);
        }

        if (colors.bottomRightColor) {
            ctx.fillStyle = colors.bottomRightColor;
            ctx.fillRect(bottomRight.x, bottomRight.y, canvas.width / 2, canvas.height / 2);
        }

        // Trigger the animation
        if (direction) {
            animate(direction);
        }

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [colors, topLeft, topRight, bottomLeft, bottomRight, offCanvasTopLeft, offCanvasTopRight, offCanvasBottomLeft, offCanvasBottomRight, currentElement, prevCol18Xpos, prevCol18Ypos]);



    useEffect(() => {
        // Log the values in the browser's console
        console.log("currentElement.col18Xpos: ", currentElement ? currentElement.col18Xpos : "Not set yet");
        console.log("currentElement.col18Ypos: ", currentElement ? currentElement.col18Ypos : "Not set yet");
        console.log("prevCol18Xpos: ", prevCol18Xpos);
        console.log("prevCol18Ypos: ", prevCol18Ypos);
    }, [currentElement, prevCol18Xpos, prevCol18Ypos]);


    // CanvasBackground.js

    const updateRectanglePositions = (direction, topLeft, topRight, bottomLeft, bottomRight, offCanvasTopLeft, offCanvasTopRight, offCanvasBottomLeft, offCanvasBottomRight, canvas) => {

        const halfCanvasWidth = canvas.width / 2;
        const halfCanvasHeight = canvas.height / 2;

        switch (direction) {
            case 'up':
                // Move all rectangles down by canvas height
                topLeft.y += halfCanvasHeight;
                topRight.y += halfCanvasHeight;
                bottomLeft.y += halfCanvasHeight;
                bottomRight.y += halfCanvasHeight;

                // Position the off-canvas rectangles at the top
                offCanvasTopLeft.y = topLeft.y - canvas.height;
                offCanvasTopRight.y = topRight.y - canvas.height;
                break;

            case 'down':
                // Move all rectangles up by canvas height
                topLeft.y -= halfCanvasHeight;
                topRight.y -= halfCanvasHeight;
                bottomLeft.y -= halfCanvasHeight;
                bottomRight.y -= halfCanvasHeight;

                // Position the off-canvas rectangles at the bottom
                offCanvasBottomLeft.y = bottomLeft.y + canvas.height;
                offCanvasBottomRight.y = bottomRight.y + canvas.height;
                break;

            case 'left':
                // Move all rectangles to the right by canvas width
                topLeft.x += halfCanvasWidth;
                topRight.x += halfCanvasWidth;
                bottomLeft.x += halfCanvasWidth;
                bottomRight.x += halfCanvasWidth;

                // Position the off-canvas rectangles on the left
                offCanvasTopLeft.x = topLeft.x - canvas.width;
                offCanvasBottomLeft.x = bottomLeft.x - canvas.width;
                break;

            case 'right':
                // Move all rectangles to the left by canvas width
                topLeft.x -= halfCanvasWidth;
                topRight.x -= halfCanvasWidth;
                bottomLeft.x -= halfCanvasWidth;
                bottomRight.x -= halfCanvasWidth;

                // Position the off-canvas rectangles on the right
                offCanvasTopRight.x = topRight.x + canvas.width;
                offCanvasBottomRight.x = bottomRight.x + canvas.width;
                break;
        }
    };



    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
}

export default CanvasBackground;
