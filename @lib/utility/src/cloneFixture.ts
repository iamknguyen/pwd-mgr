import cloneDeep from 'lodash.clonedeep';

export const cloneFixture = (fixture: object) => {
  return cloneDeep(fixture);
}