import spec from '../../config/codex/thornvolley.js';
import { makeAbility, buildTenthEditor } from './TenthEngine.js';

export const ID = spec.id;
export const ThornVolleyAbility = makeAbility(spec);
export function buildEditor(gui, c, Editor) {
  buildTenthEditor(gui, c, Editor, spec);
}
