import { useEffect } from 'react';

function KeyboardArrowsNav(currentElement, onArrowKeyPress) {

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!currentElement) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          onArrowKeyPress(event.key);
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentElement, onArrowKeyPress]);
}

export default KeyboardArrowsNav;