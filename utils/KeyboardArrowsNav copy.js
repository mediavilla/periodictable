function KeyboardArrowsNav(elements, currentElement, setCurrentElement, router) {
  const nextRightElement = currentElement ? elements.find(el => el.number === currentElement.number + 1) : null;
  const nextLeftElement = currentElement ? elements.find(el => el.number === currentElement.number - 1) : null;
  const nextTopElement = currentElement ? elements.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos - 1) : null;
  const nextBottomElement = currentElement ? elements.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos + 1) : null;

  const handleKeyDown = (event) => {
    if (!currentElement) return;

    switch (event.key) {
      case 'ArrowLeft':
        nextLeftElement && setCurrentElement(nextLeftElement);
        break;
      case 'ArrowRight':
        nextRightElement && setCurrentElement(nextRightElement);
        break;
      case 'ArrowUp':
        nextTopElement && setCurrentElement(nextTopElement);
        break;
      case 'ArrowDown':
        nextBottomElement && setCurrentElement(nextBottomElement);
        break;
      case 'Enter':
        currentElement && router.push(`/${currentElement.name}`);
        break;
      default:
        break;
    }
  }

  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  }
}


module.exports = KeyboardArrowsNav;
