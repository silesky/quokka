const R = require('ramda');
/* cmd+k q */
console.log(R.compose((x) => x * 2, (y) => y + 50)(5))
