// CanvasBackground.js
import React, { useEffect, useRef } from 'react';

const CanvasBackground = () => {
    const canvasRef = useRef(null);

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

    // Return the canvas element from the component
    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}
        />
    );
};

export default CanvasBackground;
