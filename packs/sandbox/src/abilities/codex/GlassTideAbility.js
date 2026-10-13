import spec from '../../config/codex/glasstide.js';
import { makeAbility, buildTenthEditor } from './TenthEngine.js';

export const ID = spec.id;
export const GlassTideAbility = makeAbility(spec);
export function buildEditor(gui, c, Editor) {
  buildTenthEditor(gui, c, Editor, spec);
}
