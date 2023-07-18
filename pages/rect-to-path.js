const fs = require('fs');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
    input: fs.createReadStream('svg.txt'),
    output: fs.createWriteStream('output.txt'),
    terminal: false
});

// Regular expression to match 'rect' tag and extract the necessary attributes
const rectRegex = /<rect id="(\d+)" x="(\d+\.\d+)" y="(\d+\.\d+)" width="(\d+\.\d+)" height="(\d+\.\d+)" className=\{(.*?)\} \/>/;

// Read lines
rl.on('line', (line) => {
    if (line.includes('<rect')) {
        const match = line.match(rectRegex);
        if (match) {
            const [_, id, x, y, width, height, className] = match;
            const newPath = `M${x},${y} h${width} v${height} h-${width} Z`;
            rl.output.write(`<Link href="#"><path id="${id}" d="${newPath}" className={${className}} /></Link>\n`);
        }
    } else {
        rl.output.write(line + '\n');
    }
});
