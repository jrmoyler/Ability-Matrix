import spec from '../../config/codex/arterial.js';
import { makeAbility, buildTenthEditor } from './TenthEngine.js';

export const ID = spec.id;
export const ArterialWhipAbility = makeAbility(spec);
export function buildEditor(gui, c, Editor) {
  buildTenthEditor(gui, c, Editor, spec);
}
