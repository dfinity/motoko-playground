const generateAliases = require("./generateAliases");
const aliases = generateAliases();

const moduleNameMapper = Object.entries(aliases).reduce(
  (result, [key, value]) => {
    result[`^${key}$`] = value;
    return result;
  },
  {}
);

module.exports = { moduleNameMapper };
