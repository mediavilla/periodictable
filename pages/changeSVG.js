const fs = require('fs');
const cheerio = require('cheerio');

fs.readFile('changeSVG.txt', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }

    const $ = cheerio.load(data, {
        xmlMode: true,
    });

    $('path, rect').each(function () {
        let id = $(this).attr('id');
        $(this).attr('className', `{e${id}}`);
    });

    let updatedSvg = $.html();

    fs.writeFile('changeSVG.txt', updatedSvg, function (err) {
        if (err) return console.log(err);
        console.log('File successfully written!');
    });
});
