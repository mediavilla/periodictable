const elementStyles = require('../styles/periodicTable.module.css');

function getCategoryClassName(category) {
  const categoryClassMap = {
    // Add other category mappings here
    'diatomic nonmetal': elementStyles.reactiveNonMetals,
    'polyatomic nonmetal': elementStyles.reactiveNonMetals,
    'alkali metal': elementStyles.AlkaliMetals,
    'alkaline earth metal': elementStyles.AlkalineEarthMetals,
    'transition metal': elementStyles.TransitionMetals,
    'lanthanide': elementStyles.lanthanide,
    'lanthanide lanthanum': elementStyles.lanthanum,
    'actinide': elementStyles.actinide,
    'actinide actinium': elementStyles.actinium,
    'post-transition metal': elementStyles.postTransitionMetal,
    'metalloid': elementStyles.metalloid,
    'noble gas': elementStyles.nobleGas,
    'unknown probably transition metal': elementStyles.unknownProperties,
    'unknown probably post-transition metal': elementStyles.unknownProperties,
    'unknown probably metalloid': elementStyles.unknownProperties,
    'unknown predicted to be noble gas': elementStyles.unknownProperties
  };

  return categoryClassMap[category] || '';
}

module.exports = getCategoryClassName;
