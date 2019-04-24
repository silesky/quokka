module.exports = {
  plugins: ['flowtype'],
  parserOptions: {
    sourceType: 'module',
    experimentalObjectRestSpread: true,
  },
  parser: 'babel-eslint',
  env: {
    es6: true,
    jest: true,
    browser: true,
    node: true,
    commonjs: true,

  },
};
