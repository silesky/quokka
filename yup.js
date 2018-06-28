const yup = require('yup')

const schema = yup.mixed().oneOf(['accepted', 'not accepted'], 123)

console.log(schema.validateSync('not acceptedx'))
