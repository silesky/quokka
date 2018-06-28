const YAML = require('yamljs')
/* cmd+k - q */
export const safe = fn => (arg) => {
  try {
    return fn(arg);
  } catch (err) {
    return arg;
  }
};

export const tryYAMLtoJSON = safe(YAML.parse);

console.log(tryYAMLtoJSON('hello?'))
