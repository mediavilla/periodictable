// CanvasBackground.js
import React, { useEffect, useRef, useContext, useState } from 'react';
import anime from 'animejs';
import { TableContext } from '../utils/TableProvider';
import { getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {
    const canvasRef = useRef(null);
    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);
    const [squares, setSquares] = useState([]); // State to store the squares array
    const [isInitialRender, setIsInitialRender] = useState(true);

    const directionRef = useRef('');

    // #########################################################################################
    // #########################################################################################
    // Canvas resizing
    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial call to set size

        // Cleanup listener on unmount
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);



    // #########################################################################################
    // #########################################################################################
    // Get the inital squares
    useEffect(() => {
        // Your initialSquares function logic here
        const initialSquares = () => {
            const canvas = canvasRef.current; // Define canvas from the ref
            const { topLeftColor, topRightColor, bottomLeftColor, bottomRightColor } = getQuadrantColors(currentElement, elements);

            const squares = [
                { x: 0, y: 0, color: topLeftColor },
                { x: canvas.width / 2, y: 0, color: topRightColor },
                { x: 0, y: canvas.height / 2, color: bottomLeftColor },
                { x: canvas.width / 2, y: canvas.height / 2, color: bottomRightColor },
            ];
            return squares; // Return the array of squares

        };

        // Update the squares state with the result of initialSquares
        setSquares(initialSquares());


    }, []); // Empty dependency array ensures this runs only once after the component mounts


    // #########################################################################################
    // #########################################################################################
    // Function to draw squares on the canvas
    const drawSquares = (ctx, squares) => {
        squares.forEach(square => {
            ctx.fillStyle = square.color;
            ctx.fillRect(square.x, square.y, canvasRef.current.width / 2, canvasRef.current.height / 2);
        });
    };

    // useEffect to draw squares whenever they change or the canvas ref updates
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear the canvas before redrawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawSquares(ctx, squares);
    }, [squares, canvasRef]);



    // SEQUENCE OF EVENTS FOR ANIMATION STARTS HERE:
    // #########################################################################################
    // #########################################################################################
    // 1. Deternime direction
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
    // 2. Get off-canvas squares in the right place with the right colors
    function arrayOffCanvasSquares() {
        const direction = directionRef.current; // Access the current direction value
        const canvas = canvasRef.current;

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
            offCanvasSquareOne = { x: canvas.width, y: 0 };
            offCanvasSquareTwo = { x: canvas.width, y: canvas.height / 2 }
        } else if (direction === 'left') {
            // offCanvasSquareOne top left & offCanvasSquareTwo bottom left
            offCanvasSquareOne = { x: -canvas.width / 2, y: 0 };
            offCanvasSquareTwo = { x: -canvas.width / 2, y: canvas.height / 2 }
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

        return [
            { x: offCanvasSquareOne.x, y: offCanvasSquareOne.y, color: offCanvasSquareOneColor },
            { x: offCanvasSquareTwo.x, y: offCanvasSquareTwo.y, color: offCanvasSquareTwoColor }
        ].filter(Boolean);   // Keep this to filter out if any object happens to be null or undefined
    }

    // #########################################################################################
    // #########################################################################################
    // Merge arrays 

    let offCanvasSquares = [];
    let canvasSquares = squares;
    let mergedSquares = [];
    function mergeSquaresArrays() {
        mergedSquares = [...canvasSquares, ...offCanvasSquares];
        return mergedSquares;
    }
    // #########################################################################################
    // #########################################################################################
    // Remove squares that are moved off canvas

    function updateSquaresArray() {

        let newSquares;
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;
        const direction = directionRef.current;

        switch (direction) {
            case 'down':
                // Keep squares that have not moved off the top of the canvas
                newSquares = mergedSquares.filter(sq => sq.y >= 0);
                break;
            case 'up':
                // Keep squares not below the canvas
                newSquares = mergedSquares.filter(sq => sq.y + canvasHeight / 2 <= canvasHeight);
                break;
            case 'right':
                // Keep squares not to the left of the canvas
                newSquares = mergedSquares.filter(sq => sq.x >= 0);
                break;
            case 'left':
                // Keep squares not to the right of the canvas
                newSquares = mergedSquares.filter(sq => sq.x + canvasWidth / 2 <= canvasWidth);
                break;
            default:
                newSquares = [...mergedSquares];
        }

        setSquares(newSquares);
    }

    // #########################################################################################
    // #########################################################################################
    // Animation
    function moveSquares() {
        let targetX = 0;  // Initialize targetX
        let targetY = 0;  // Initialize targetY
        const canvas = canvasRef.current;

        const direction = directionRef.current;
        if (direction === 'down') {
            targetY -= canvas.height / 2;
        } else if (direction === 'up') {
            targetY += canvas.height / 2;
        } else if (direction === 'right') {
            targetX -= canvas.width / 2;
        } else if (direction === 'left') {
            targetX += canvas.width / 2;
        }


        const animateSquares = (squares) => {
            anime({
                targets: squares, // Use the argument 'squares'
                x: '+= ' + targetX, // Adjusting x position
                y: '+= ' + targetY, // Adjusting y position
                easing: 'easeInOutQuad',
                duration: 2000,
                update: function (anim) {
                    drawSquares(canvasRef.current.getContext('2d'), squares);
                },
                complete: function (anim) {
                    // Animation complete callback
                    updateSquaresArray(); // Function to update the squares array
                }
            });
        };

        animateSquares(mergedSquares); // Call animateSquares here
    }


    // #########################################################################################
    // #########################################################################################
    // Sequencing

    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
            return;
        }

        setDirection(); // Set the direction
        offCanvasSquares = arrayOffCanvasSquares();
        mergeSquaresArrays();
        moveSquares();

    }, [currentElement]); // Run whenever currentElement changes




    // Return the canvas element from the component
    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}
        />
    );
};

export default CanvasBackground;
