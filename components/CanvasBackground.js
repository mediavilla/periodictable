import React, { useRef, useEffect } from 'react';

function CanvasBackground({ colors = {} }) {

    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Apply blur filter
        ctx.filter = 'blur(150px)';

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the rectangles
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
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Redraw quadrants after resizing
        });

        // Cleanup
        return () => {
            window.removeEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        };
    }, [colors]);

    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
}

export default CanvasBackground;
