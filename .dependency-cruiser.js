// .dependency-cruiser.js
module.exports = {
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsConfig: {
      fileName: "./tsconfig.json",
    },
    includeOnly: "^src", // analizar solo src
    exclude: "^src/.+/index\\.ts$", // ignorar barrels internos
    combinedDependencies: true,
  },
};
