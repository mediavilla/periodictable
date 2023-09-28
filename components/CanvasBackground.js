// CanvasBackground.jsx
import React, { useRef, useEffect, useContext, useState } from 'react';
import { TableContext } from '../utils/TableProvider';

function CanvasBackground({ colors = {} }) {
    const canvasRef = useRef(null);
    const { currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    const [positionsChanged, setPositionsChanged] = useState(false);

    const [rectangles, setRectangles] = useState([]); // To store the six rectangles NOT SURE IF I NEED THIS

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

        // Inside getDirection function
        console.log("Inside getDirection, returning: ", /* whatever getDirection returns */);

        console.log("currentElement in getDirection:", currentElement);
        console.log("prevCol18Xpos in getDirection:", prevCol18Xpos);
        console.log("prevCol18Ypos in getDirection:", prevCol18Ypos);


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
    const animate = (direction, setRectangles, canvas, ctx) => {
        console.log('Animating', direction);

        let start;

        const step = (timestamp) => {
            if (start === undefined) {
                start = timestamp;
            }
            const elapsed = timestamp - start;

            // Update the rectangles' positions based on elapsed time and direction
            updateRectanglePositions(direction, topLeft, topRight, bottomLeft, bottomRight, offCanvasTopLeft, offCanvasTopRight, offCanvasBottomLeft, offCanvasBottomRight, canvas);

            // Redraw the rectangles
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            rectangles.forEach((rect, index) => {
                ctx.fillStyle = rect.color;
                ctx.fillRect(rect.x, rect.y, canvas.width / 2, canvas.height / 2);
            });

            if (elapsed < 1000) { // Stop after one second
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };


    useEffect(() => {
        // Initialization logic here
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (rectangles.length === 0) {
            const initialRectangles = [
                { x: 0, y: 0, color: colors.topLeftColor || 'black' },
                { x: canvas.width / 2, y: 0, color: colors.topRightColor || 'black' },
                { x: 0, y: canvas.height / 2, color: colors.bottomLeftColor || 'black' },
                { x: canvas.width / 2, y: canvas.height / 2, color: colors.bottomRightColor || 'black' },
            ];
            setRectangles(initialRectangles);

            console.log("INITIAL REC: ", initialRectangles)
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
    }, []);




    useEffect(() => {
        // Update logic here
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const direction = getDirection();


        console.log("Canvas dimensions:", canvas.width, canvas.height);
        console.log("Rectangles!!!!!!!!:", rectangles);

        // Inside the update useEffect
        console.log("Is update useEffect running?: ", "Yes");
        console.log("Value of direction: ", direction);
        console.log("Value of positionsChanged: ", positionsChanged);

        // Apply blur filter
        ctx.filter = 'blur(150px)';

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the rectangles based on passed colors
        rectangles.forEach((rect, index) => {
            ctx.fillStyle = rect.color;
            ctx.fillRect(rect.x, rect.y, canvas.width / 2, canvas.height / 2);
        });

        console.log("direction: ", direction)
        console.log("positionsChanged: ", positionsChanged)


        if (currentElement && (prevCol18Xpos !== currentElement.col18Xpos || prevCol18Ypos !== currentElement.col18Ypos)) {
            // Update the rectangles and positions
            const updatedRectangles = [
                { x: topLeft.x, y: topLeft.y, color: colors.topLeftColor },
                { x: topRight.x, y: topRight.y, color: colors.topRightColor },
                { x: bottomLeft.x, y: bottomLeft.y, color: colors.bottomLeftColor },
                { x: bottomRight.x, y: bottomRight.y, color: colors.bottomRightColor },
            ];

            if (updatedRectangles.length > 0) {
                setRectangles(updatedRectangles);
            }
        }

        if (direction && !positionsChanged) {
            const { newTopLeft, newTopRight, newBottomLeft, newBottomRight } = updateRectanglePositions(direction, topLeft, topRight, bottomLeft, bottomRight, offCanvasTopLeft, offCanvasTopRight, offCanvasBottomLeft, offCanvasBottomRight, canvas);

            // Check if positions have actually changed
            if (JSON.stringify({ topLeft, topRight, bottomLeft, bottomRight }) !== JSON.stringify({ newTopLeft, newTopRight, newBottomLeft, newBottomRight })) {
                setTopLeft(newTopLeft);
                setTopRight(newTopRight);
                setBottomLeft(newBottomLeft);
                setBottomRight(newBottomRight);
                setPositionsChanged(true);  // Update the flag

                console.log("newTopLeft: ", newTopLeft)
                console.log("newTopRight: ", newTopRight)
                console.log("newBottomLeft: ", newBottomLeft)
                console.log("newBottomRight: ", newBottomRight)

            }
        }

    }, [topLeft, topRight, bottomLeft, bottomRight, offCanvasTopLeft, offCanvasTopRight, offCanvasBottomLeft, offCanvasBottomRight, positionsChanged]);

    useEffect(() => {
        if (positionsChanged) {
            setPositionsChanged(false);
        }
    }, [positionsChanged]);

    useEffect(() => {
        // Log the values in the browser's console
        console.log("currentElement.col18Xpos: ", currentElement ? currentElement.col18Xpos : "Not set yet");
        console.log("currentElement.col18Ypos: ", currentElement ? currentElement.col18Ypos : "Not set yet");
        console.log("prevCol18Xpos: ", prevCol18Xpos);
        console.log("prevCol18Ypos: ", prevCol18Ypos);
    }, [currentElement, prevCol18Xpos, prevCol18Ypos]);


    useEffect(() => {
        console.log("Rectangles state changed:", rectangles);
    }, [rectangles]);

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

        } return {

            newTopLeft: { x: topLeft.x, y: topLeft.y },
            newTopRight: { x: topRight.x, y: topRight.y },
            newBottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
            newBottomRight: { x: bottomRight.x, y: bottomRight.y }

        }
    };


    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
}

export default CanvasBackground;
