// ##########################################################################################
// ##########################################################################################
// ##########################################################################################

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
        ]
        : null;
}

function rgbToHex(rgb) {
    return "#" + rgb.map(function (value) {
        return ("0" + value.toString(16)).slice(-2);
    }).join('');
}

function interpolateColor(color1, color2, factor) {
    let result = [];
    for (let i = 0; i < 3; i++) {
        result.push(Math.round(color1[i] + factor * (color2[i] - color1[i])));
    }
    return result;
}

function interpolateColors(color1, color2, steps) {
    let stepFactor = 1 / (steps - 1),
        interpolatedColorArray = [];
    color1 = hexToRgb(color1);
    color2 = hexToRgb(color2);
    for (let i = 0; i < steps; i++) {
        interpolatedColorArray.push(rgbToHex(interpolateColor(color1, color2, stepFactor * i)));
    }
    return interpolatedColorArray;
}

// List of your sequences
let sequences = [
    [[1, 9, 17, 35, 53, 85], "#C5B4BA", "#3A2C79"],
    [[2, 10, 18, 36, 54, 86], "#C9C6CD", "#585161"],
    [[3, 11, 19, 37, 55, 87], "#F3D3C6", "#CD7557"],
    [[4, 12, 20, 38, 56, 88], "#F9E2C2", "#E5A069"],
    [[5, 13, 21, 39, 57], "#FAE8D0", "#D0BF79"],
    [[6, 14, 22, 40, 72, 104], "#DCDACB", "#858869"],
    [[7, 15, 33, 51, 83], "#C5C6CA", "#5D706C"],
    [[8, 16, 34, 52, 84], "#AFB0E0", "#3F468E"],
    [[23, 41, 73], "#AFB0E0", "#3F468E"],
    [[24, 42, 74], "#737C9B", "#3F468E"],
    [[25, 43, 75], "#927E9B", "#564B76"],
    [[26, 44, 76], "#747DB4", "#3F468E"],
    [[27, 45, 77], "#BFC199", "#97AF61"],
    [[28, 46, 78], "#F3BA73", "#F1A359"],
    [[29, 47, 79], "#C78865", "#A95E47"],
    [[30, 48, 80], "#E9AC6D", "#CF8D51"],
    [[31, 49, 81], "#EFDA6D", "#EACA65"],
    [[32, 50, 82], "#BFC199", "#97AF61"]
];

// Create color mappings
let colorMappings = {};
for (let [sequence, colorStart, colorEnd] of sequences) {
    let colors = interpolateColors(colorStart, colorEnd, sequence.length);
    for (let i = 0; i < sequence.length; i++) {
        colorMappings[sequence[i]] = colors[i];
    }
}

// Create CSS
let css = "";
for (let [element, color] of Object.entries(colorMappings)) {
    css += `.e${element} { fill: ${color} !important; }\n`;
}
console.log(css);



    // ##########################################################################################
    // ##########################################################################################
    // ##########################################################################################