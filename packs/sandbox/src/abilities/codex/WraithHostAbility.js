import { createStubAbility, stubEditor } from '../collective/_stub.js';

export const ID = 'wraiths';
export const WraithHostAbility = createStubAbility(ID);
export const buildEditor = stubEditor(ID, 'Wraith Host');
