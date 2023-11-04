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

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const { topLeftColor, topRightColor, bottomLeftColor, bottomRightColor } = getQuadrantColors(currentElement, elements);

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            console.log("topLeftColor: ", topLeftColor)

            const InitialSquares = [
                { x: 0, y: 0, color: topLeftColor },
                { x: window.innerWidth / 2, y: 0, color: topRightColor },
                { x: 0, y: window.innerHeight / 2, color: bottomLeftColor },
                { x: window.innerWidth / 2, y: window.innerHeight / 2, color: bottomRightColor }
            ];


            // console.log("ALL SQUARES: ", allSquares)
            InitialSquares.forEach(square => {
                // console.log('Square:', square);
                if (square) {  // Check if square is not undefined
                    ctx.fillStyle = square.color;
                    ctx.fillRect(square.x, square.y, canvas.width / 2, canvas.height / 2);
                }
            });
            // After running your logic, set isInitialized to true
            setIsInitialized(true);
        }


    }, [elements, currentElement, isInitialized]);




    // Render the canvas
    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
};

export default CanvasBackground;
