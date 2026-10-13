import spec from '../../config/codex/acidchoir.js';
import { makeAbility, buildTenthEditor } from './TenthEngine.js';

export const ID = spec.id;
export const AcidChoirAbility = makeAbility(spec);
export function buildEditor(gui, c, Editor) {
  buildTenthEditor(gui, c, Editor, spec);
}
