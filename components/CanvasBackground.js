// CanvasBackground.jsx
import React, { useRef, useEffect, useContext, useState } from 'react';
import { TableContext } from '../utils/TableProvider';

function CanvasBackground({ colors = {} }) {
    const canvasRef = useRef(null);
    const { currentElement } = useContext(TableContext);

    const [rectangles, setRectangles] = useState([
        { x: 0, y: 0, color: 'transparent' },
        { x: 0, y: 0, color: 'transparent' },
        { x: 0, y: 0, color: 'transparent' },
        { x: 0, y: 0, color: 'transparent' },
        { x: 0, y: 0, color: 'transparent' },
        { x: 0, y: 0, color: 'transparent' }
    ]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply blur filter
        ctx.filter = 'blur(150px)';

        rectangles.forEach(rect => {
            ctx.fillStyle = rect.color;
            ctx.fillRect(rect.x, rect.y, canvas.width / 2, canvas.height / 2);
        });

        // Draw the rectangles based on passed colors
        if (colors.topLeftColor) {
            ctx.fillStyle = colors.topLeftColor;
            ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
        }

        if (colors.bottomLeftColor) {
            ctx.fillStyle = colors.bottomLeftColor;
            ctx.fillRect(0, canvas.height / 2, canvas.width / 2, canvas.height / 2);
        }

        if (colors.topRightColor) {
            ctx.fillStyle = colors.topRightColor;
            ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2);
        }

        if (colors.bottomRightColor) {
            ctx.fillStyle = colors.bottomRightColor;
            ctx.fillRect(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2);
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
    }, [colors, currentElement]);

    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
}

export default CanvasBackground;
