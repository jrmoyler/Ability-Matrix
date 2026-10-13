import spec from '../../config/codex/whiteout.js';
import { makeAbility, buildTenthEditor } from './TenthEngine.js';

export const ID = spec.id;
export const WhiteoutNeedleAbility = makeAbility(spec);
export function buildEditor(gui, c, Editor) {
  buildTenthEditor(gui, c, Editor, spec);
}
