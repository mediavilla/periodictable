const elementStyles = require('../styles/element.module.css');

function getCategoryHexColor(category) {
    const categoryClassMap = {
        // Add other category mappings here
        'diatomic nonmetal': "#FF00FF",
        'polyatomic nonmetal': "#15D905",
        'alkali metal': "#05B6BB",
        'alkaline earth metal': "#DD201C",
        'transition metal': "#0070FF",
        'lanthanide': "#7A00FF",
        'lanthanide lanthanum': "#7A00FF",
        'actinide': "#FF7500",
        'actinide actinium': "#FF7500",
        'post-transition metal': "#15D905",
        'metalloid': "#959339",
        'noble gas': "#CCCCCC",
        'unknown probably transition metal': "#454545",
        'unknown probably post-transition metal': "#454545",
        'unknown probably metalloid': "#454545",
        'unknown predicted to be noble gas': "#454545"
    };

    return categoryClassMap[category] || '';
}

module.exports = getCategoryHexColor;
