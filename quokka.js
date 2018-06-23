const cl = console.log;
// cmd-k + q (to run)
// cmd-k + l (to start)
const R = require('ramda');
const _ = require('lodash');
const yup = require('yup');
const defaultFormGroups = [
  {
    groupName: 'Foo',
    formData: [
      {
        initialValue: 'foo',
        validationType: ['number', 'required'],
      },
    ],
  },
  {
    formData: [
      {
        initialValue: null,
        validationType: ['string', 'required'], // quick start
      },
    ],
  },
  {
    groupName: 'Bar',
    formData: [
      {
        initialValue: '',
        validationType: ['string', 'required'], // quick start
      },
      {
        initialValue: 'bar',
        validationType: ['string', 'array'],
      },
    ],
  },
];

const expected = [
  {
    groupName: 'Foo',
    formData: [
      {
        initialValue: null,
        validationType: ['string', 'required'], // quick start
      },
    ],
  },
  {
    groupName: 'Bar',
    formData: [
      {
        initialValue: '',
        validationType: ['string', 'required'], // quick start
      },
    ],
  },
];
const getQS = chartDetails => {
  return chartDetails.reduce((accum, eachGroup) => {
    const { formData, groupName } = eachGroup;
    const formDataElements = formData.filter(
      ({ validationType, initialValue }) =>
        validationType.includes('required') &&
        (R.isEmpty(initialValue) || R.isNil(initialValue)),
    );
    console.log(eachGroup);
    return formDataElements.length
      ? [...accum, { ...eachGroup, formData: formDataElements }]
      : accum;
  }, []);
};
// R.pipe(
//     R.map(R.prop('formData')),
//     R.flatten,
//     R.filter(({ validationType, initialValue }) => {
//       return (
//         validationType.includes('required') &&
//         (R.isEmpty(initialValue) || R.isNil(initialValue))
//       );
//     }),
// )(chartDetails);

const qs = getQS(defaultFormGroups);

console.log('qs!', qs);
