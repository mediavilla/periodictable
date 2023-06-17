const elementStyles = require('../styles/periodicTable.module.css');

function getCategoryClassName(category, isSelected) {
  const categoryClassMap = {
    // Add other category mappings here
    'diatomic nonmetal': isSelected ? `${elementStyles.reactiveNonMetals} ${elementStyles.selected}` : elementStyles.reactiveNonMetals,
    'polyatomic nonmetal': isSelected ? `${elementStyles.reactiveNonMetals} ${elementStyles.selected}` : elementStyles.reactiveNonMetals,
    'alkali metal': isSelected ? `${elementStyles.AlkaliMetals} ${elementStyles.selected}` : elementStyles.AlkaliMetals,
    'alkaline earth metal': isSelected ? `${elementStyles.AlkalineEarthMetals} ${elementStyles.selected}` : elementStyles.AlkalineEarthMetals,
    'transition metal': isSelected ? `${elementStyles.TransitionMetals} ${elementStyles.selected}` : elementStyles.TransitionMetals,
    'lanthanide': isSelected ? `${elementStyles.lanthanide} ${elementStyles.selected}` : elementStyles.lanthanide,
    'lanthanide lanthanum': isSelected ? `${elementStyles.lanthanum} ${elementStyles.selected}` : elementStyles.lanthanum,
    'actinide': isSelected ? `${elementStyles.actinide} ${elementStyles.selected}` : elementStyles.actinide,
    'actinide actinium': isSelected ? `${elementStyles.actinium} ${elementStyles.selected}` : elementStyles.actinium,
    'post-transition metal': isSelected ? `${elementStyles.postTransitionMetal} ${elementStyles.selected}` : elementStyles.postTransitionMetal,
    'metalloid': isSelected ? `${elementStyles.metalloid} ${elementStyles.selected}` : elementStyles.metalloid,
    'noble gas': isSelected ? `${elementStyles.nobleGas} ${elementStyles.selected}` : elementStyles.nobleGas,
    'unknown probably transition metal': isSelected ? `${elementStyles.unknownProperties} ${elementStyles.selected}` : elementStyles.unknownProperties,
    'unknown probably post-transition metal': isSelected ? `${elementStyles.unknownProperties} ${elementStyles.selected}` : elementStyles.unknownProperties,
    'unknown probably metalloid': isSelected ? `${elementStyles.unknownProperties} ${elementStyles.selected}` : elementStyles.unknownProperties,
    'unknown predicted to be noble gas': isSelected ? `${elementStyles.unknownProperties} ${elementStyles.selected}` : elementStyles.unknownProperties,


  };

  return categoryClassMap[category] || '';
}

module.exports = getCategoryClassName;
