import { createStubAbility, stubEditor } from '../collective/_stub.js';

export const ID = 'orbital';
export const OrbitalStrikeAbility = createStubAbility(ID);
export const buildEditor = stubEditor(ID, 'Orbital Strike');
