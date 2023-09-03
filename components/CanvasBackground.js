import React, { useRef, useEffect, useContext } from 'react';
import { TableContext } from '../utils/TableProvider';

function CanvasBackground({ colors = {} }) {

    const canvasRef = useRef(null);

    const { currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    const animate = (ctx, startX, startY, endX, endY, color, duration) => {
        const startTime = performance.now();
        const draw = (currentTime) => {
            const timePassed = currentTime - startTime;
            const progress = Math.min(timePassed / duration, 1);
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, canvas.width / 2, canvas.height / 2);

            if (progress < 1) {
                requestAnimationFrame(draw);
            }
        };
        requestAnimationFrame(draw);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Apply blur filter
        ctx.filter = 'blur(150px)';

        // Determine the direction of movement
        let moveX = 0, moveY = 0;
        if (prevCol18Xpos && currentElement) {
            moveX = (currentElement.col18Xpos - prevCol18Xpos) * 10; // Multiplier for more noticeable movement
        }
        if (prevCol18Ypos && currentElement) {
            moveY = (currentElement.col18Ypos - prevCol18Ypos) * 10; // Multiplier for more noticeable movement
        }

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the rectangles with animation and conditional checks
        if (colors.topLeftColor) {
            ctx.fillStyle = colors.topLeftColor;
            ctx.fillRect(0 + moveX, 0 + moveY, canvas.width / 2, canvas.height / 2);
        }

        if (colors.bottomLeftColor) {
            ctx.fillStyle = colors.bottomLeftColor;
            ctx.fillRect(0 + moveX, canvas.height / 2 + moveY, canvas.width / 2, canvas.height / 2);
        }

        if (colors.topRightColor) {
            ctx.fillStyle = colors.topRightColor;
            ctx.fillRect(canvas.width / 2 + moveX, 0 + moveY, canvas.width / 2, canvas.height / 2);
        }

        if (colors.bottomRightColor) {
            ctx.fillStyle = colors.bottomRightColor;
            ctx.fillRect(canvas.width / 2 + moveX, canvas.height / 2 + moveY, canvas.width / 2, canvas.height / 2);
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
    }, [colors, currentElement, prevCol18Xpos, prevCol18Ypos]);

    return (
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }} />
    );
}

export default CanvasBackground;
