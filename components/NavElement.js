import React, { useContext, useEffect } from 'react';
import { TableContext } from '../utils/TableProvider';
import { useRouter } from 'next/router';
import navElementStyles from '../styles/navElement.module.css';
import Link from 'next/link';
import elementsData from '../public/elements.json';
import getCategoryClassName from '../utils/getCategoryClassName'; // Import the getCategoryClassName function

export default function NavElement() {
    const { currentElement } = useContext(TableContext);
    const router = useRouter();

    // Return early if currentElement is not yet defined
    if (!currentElement) {
        return null;
    }

    // Determine the next elements in each direction
    const nextRightElement = elementsData.find(el => el.number === currentElement.number + 1);
    const nextLeftElement = elementsData.find(el => el.number === currentElement.number - 1);
    const nextTopElement = elementsData.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos - 1);
    const nextBottomElement = elementsData.find(el => el.col18Xpos === currentElement.col18Xpos && el.col18Ypos === currentElement.col18Ypos + 1);

    console.log("NAV ELEMENT: ", currentElement)

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!currentElement) return;

            switch (event.key) {
                case 'ArrowLeft':
                    nextLeftElement && router.push(`/${nextLeftElement.name}`);
                    break;
                case 'ArrowRight':
                    nextRightElement && router.push(`/${nextRightElement.name}`);
                    break;
                case 'ArrowUp':
                    nextTopElement && router.push(`/${nextTopElement.name}`);
                    break;
                case 'ArrowDown':
                    nextBottomElement && router.push(`/${nextBottomElement.name}`);
                    break;
                default:
                    break;
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [currentElement, nextLeftElement, nextRightElement, nextTopElement, nextBottomElement, router]);


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
