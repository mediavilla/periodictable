// CanvasBackground.js

import React, { useEffect, useContext, useRef, useState, useCallback } from 'react';
import { TableContext } from '../utils/TableProvider';
import { getAdjacentElements, getQuadrantColors, getOffCanvasSquaresColors } from '../utils/getQuadrantColors';

const CanvasBackground = () => {

    const { elements, currentElement, prevCol18Xpos, prevCol18Ypos } = useContext(TableContext);

    console.log("CANVAS: getQuadrantColors", getQuadrantColors(currentElement, elements))
    console.log("CANVAS: getAdjacentElements", getAdjacentElements(currentElement, elements))


    // Render the canvas
    return (
        <p>shit</p>
    );
};

export default CanvasBackground;
