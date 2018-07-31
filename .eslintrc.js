module.exports = {
  plugins: ['flowtype'],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  env: {
    es6: true,
    jest: true,
    browser: true,
    node: true,
    commonjs: true,
  },
};
