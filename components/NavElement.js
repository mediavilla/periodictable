import React, { useContext } from 'react';
import { TableContext } from '../utils/TableProvider';
import { useRouter } from 'next/router';
import Link from 'next/link';
import navElementStyles from '../styles/navElement.module.css';
import elementsData from '../public/elements.json';
import KeyboardArrowsNav from '../utils/KeyboardArrowsNav.js'
import getCategoryClassName from '../utils/getCategoryClassName'; // Import the getCategoryClassName function

export default function NavElement() {

    const { currentElement, setCurrentElement } = useContext(TableContext);
    const router = useRouter();

    // Determine the next elements in each direction
    const nextRightElement = currentElement ? elementsData.find(el => el.number === currentElement.number + 1) : null;
    const nextLeftElement = currentElement ? elementsData.find(el => el.number === currentElement.number - 1) : null;
    const nextTopElement = currentElement ? elementsData.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos - 1) : null;
    const nextBottomElement = currentElement ? elementsData.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos + 1) : null;


    KeyboardArrowsNav(currentElement, (key) => {
        let nextElement;

        switch (key) {
            case 'ArrowLeft':
                nextElement = elementsData.find(el => el.number === currentElement.number - 1);
                break;
            case 'ArrowRight':
                nextElement = elementsData.find(el => el.number === currentElement.number + 1);
                break;
            case 'ArrowUp':
                nextElement = elementsData.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos - 1);
                break;
            case 'ArrowDown':
                event.preventDefault(); // prevent the default scroll action
                nextElement = elementsData.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos + 1);
                break;
            default:
                break;
        }

        nextElement && setCurrentElement(nextElement);
    });



    if (!currentElement) {
        return null; // Return early if currentElement is not yet defined
    }

    return (
        <div className={navElementStyles.navButtonsContainer}>
            {nextRightElement &&
                <Link href={`/${nextRightElement ? nextRightElement.name : ''}`}>
                    <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavRight} ${getCategoryClassName(nextRightElement.category)}`}>
                        {nextRightElement ? nextRightElement.name : 'No element'}
                    </button >
                </Link>
            }
            {nextLeftElement &&
                <Link href={`/${nextLeftElement ? nextLeftElement.name : ''}`}>
                    <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavLeft} ${getCategoryClassName(nextLeftElement.category)}`}>
                        {nextLeftElement ? nextLeftElement.name : 'No element'}
                    </button >
                </Link>
            }
            {nextTopElement &&
                <Link href={`/${nextTopElement ? nextTopElement.name : ''}`}>
                    <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavTop} ${getCategoryClassName(nextTopElement.category)}`}>
                        {nextTopElement ? nextTopElement.name : 'No element'}
                    </button >
                </Link>
            }
            {nextBottomElement &&
                <Link href={`/${nextBottomElement ? nextBottomElement.name : ''}`}>
                    <button className={`${navElementStyles.navButton} ${navElementStyles.buttonNavBottom} ${getCategoryClassName(nextBottomElement.category)}`}>
                        {nextBottomElement ? nextBottomElement.name : 'No element'}
                    </button >
                </Link>
            }
        </div>
    );
}
