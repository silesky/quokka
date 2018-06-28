// @flow
import R from 'ramda';
import { deepReduce, insertIf } from 'utils';
import type {
  ValueMetadataOptionT,
  FormGroupT,
  FormDataT,
  MergedGroupT,
  ValuesT,
  ValuesMetadataT,
} from 'types';
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */

// "global.foo" --> "foo"
// "foo.bar.baz" --> "baz"
const validateLabel = (str = '') => {
  return str
    .split('.')
    .filter((_, ind, arr) => ind === arr.length - 1)
    .join('')
    .replace(/\bglobal./, '');
};

const notObject = el => R.type(el) !== 'Object';

export const createGroup = ({
  description = '',
  groupName,
  id,
  formData = [],
}: {
  description?: string,
  groupName?: string,
  id: string,
  formData: FormDataT[],
}): FormGroupT => {
  return {
    id,
    groupName: validateLabel(groupName),
    description,
    formData,
  };
};

const getInitialValue = (dataType, value) => {
  switch (dataType) {
    case 'Null':
      return '';
    case 'Undefined':
      return '';
    default:
      return value;
  }
};

export const createFormDataElement = ({
  id,
  initialValue,
  description,
  label,
  options,
  type = 'string',
  required,
  immutable,
  hidden,
  validation,
  validationType, // will not come from API
}: {
  description?: string,
  disabled?: string,
  id: string,
  immutable?: boolean,
  hidden?: boolean,
  initialValue: string,
  label?: string,
  options?: ValueMetadataOptionT[],
  required?: boolean,
  type?: string,
  validationType?: any[],
  validation?: string,
}): FormDataT => {
  // global is a help api construct that will be in some values. we never want to display it to the user
  const initialValueType = R.type(initialValue);

  return {
    id,
    initialValue: getInitialValue(initialValueType, initialValue),
    description: description || '',
    disabled: immutable || false,
    label: validateLabel(label || id),
    options: options || [],
    hidden: hidden || false,
    regex: validation || '',
    validationType: validationType || [
      ...insertIf(initialValueType === 'Array', 'array'),
      ...insertIf(initialValueType === 'Object', 'object'),
      ...insertIf(type !== undefined, type),
      ...insertIf(required === true, 'required'),
    ],
  };
};

// search through any given node of the tree and pull out the "values" (i.e. anything that's not an object).. that belong to the same group.
// definition of value: anything with an 'initialValue' key.
// initialValue only appears on key conflict.
// This means that if a corresponding key is missing in the metadata, it will not be renamed 'initialValue'.
const findSiblingValuesFromMetadataAndValues = (node) => {
  if (notObject(node)) {
    return [];
  }

  return Object.keys(node).reduce((accum, eachKey) => {
    const eachValue = node[eachKey];
    if (notObject(eachValue)) {
      return accum;
    }
    const isOrphanValue = (val) => {
      const t = R.type(val);
      if (t === 'Object' || t === 'Array') {
        return R.isEmpty(val);
      }
      return (val !== undefined);
    };
    // check if eachValue object has an 'initialValue' key.
    if (R.has('initialValue', eachValue)) {
      return [
        ...accum,
        {
          initialValue: eachValue.initialValue,
          key: eachKey,
          metadata: eachValue.__metadata || {},
        },
      ];
    } else if (isOrphanValue(eachValue)) {
      return [
        ...accum,
        {
          initialValue: eachValue,
          key: eachKey,
          metadata: {},
        }];
    }
    return accum;
  }, []);
};

// takes a merged object and applies a deepReduce against it...
// converts it to a data structure that can be converted to react form groups and elements.
export const flattenMergedMetadataAndValues = (merged: MergedGroupT): FormGroupT[] => {
  const reducer = (accum, value, keyPath = []) => {
    const foundValues = findSiblingValuesFromMetadataAndValues(value);
    if (foundValues.length) {
      const formData = foundValues.map(({ initialValue, key, metadata: md }) => {
        const id = [...keyPath, key].join('.');
        return createFormDataElement({
          id,
          initialValue,
          description: md.description,
          label: md.label,
          options: md.options,
          type: md.type,
          required: md.required,
          immutable: md.immutable,
          hidden: md.hidden,
          validation: md.validation,
        });
      });

      return [
        ...accum,
        createGroup({
          description: R.path(['__metadata', 'description'], value),
          groupName: R.pathOr(R.last(keyPath), ['__metadata', 'label'], value),
          id: keyPath.join('.'),
          formData,
        }),
      ];
    }

    return accum;
  };

  return deepReduce(merged, reducer, []);
};

// merge the first object with a second object, taking the first object's keys as the source of truth
export const mergeValuesAndMetadata = (
  values: ValuesT,
  valuesMetadata: ValuesMetadataT,
): MergedGroupT => {
  // if values metadata has some unique props, do not include. values is source of truth.
  const valuesMetadataWithoutUniqueProps = R.pick(
    R.intersection(Object.keys(values), Object.keys(valuesMetadata)),
    valuesMetadata,
  );
  const handleKeyConflict = (left, right) => ({
    initialValue: left,
    ...right,
  });
  return R.mergeDeepWith(
    handleKeyConflict,
    values,
    valuesMetadataWithoutUniqueProps,
  );
};

const isNotObject = el => R.type(el) !== 'Object';

// search through any given node of the tree and pull out the "values" (i.e. anything that's not an object).. that belong to the same group.
const findSiblingValues = (node) => {
  if (isNotObject(node)) {
    return [];
  }
  return Object.keys(node).reduce((accum, eachKey) => {
    if (isNotObject(node[eachKey]) || R.isEmpty(node[eachKey])) {
      return [
        ...accum,
        {
          initialValue: node[eachKey],
          key: eachKey,
        },
      ];
    }
    return accum;
  }, []);
};

// if there is no metadata, flattening is simpler
const flattenValuesWithoutMetadata = (values: ValuesT): FormGroupT[] => {
  const reducer = (accum, value, keyPath = []) => {
    const foundValues = findSiblingValues(value);
    if (foundValues.length) {
      // a group's formData should only be their direct children.
      return [
        ...accum,
        createGroup({
          groupName: R.last(keyPath),
          id: keyPath.join('.'),
          formData: foundValues.map(({ key: k, initialValue }) => {
            const id = [...keyPath, k].join('.');
            return createFormDataElement({
              id,
              initialValue,
            });
          }),
        }),
      ];
    }

    return accum;
  };

  return deepReduce(values, reducer, []);
};
const cl = o => console.log(JSON.stringify(o, null, 2));
const chartDetailsMetadataTransform = (
  values: ValuesT,
  valuesMetadata: ValuesMetadataT = {},
): FormGroupT[] => {
  let reduced = [];
  if (R.isEmpty(valuesMetadata)) {
    reduced = flattenValuesWithoutMetadata(values);
  } else {
    const merged: MergedGroupT = mergeValuesAndMetadata(values, valuesMetadata);
    reduced = flattenMergedMetadataAndValues(merged);
  }
  return reduced;
};

export default chartDetailsMetadataTransform;
