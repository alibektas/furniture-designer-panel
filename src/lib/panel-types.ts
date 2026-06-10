/**
 * Panel-type catalog.
 *
 * A panel type is defined purely by its width × height (in cm) plus the side
 * (left / right). The allowed dimensions are derived from the company
 * part-number codes, e.g.
 *
 *   pno_ts-f_a070-h140-art-70x140left   → width 70,  height 140, side left
 *   pno_ts-f_a105-h210-art-105x210right → width 105, height 210, side right
 *
 * where `a0NN` encodes the width and `hNNN` encodes the height. This module is
 * safe to import on the client (it is pure data) so the add-artwork dialog can
 * render the dropdown from the same source the server validates against.
 */

/** Allowed panel widths in cm (from the `a0NN` codes). */
export const PANEL_WIDTHS = [70, 105] as const;

/** Allowed panel heights in cm (from the `hNNN` codes). */
export const PANEL_HEIGHTS = [105, 140, 175, 210] as const;

/** Allowed sides. */
export const PANEL_SIDES = ['left', 'right'] as const;

export type PanelWidth = (typeof PANEL_WIDTHS)[number];
export type PanelHeight = (typeof PANEL_HEIGHTS)[number];
export type PanelSide = (typeof PANEL_SIDES)[number];

export interface PanelType {
	widthCm: PanelWidth;
	heightCm: PanelHeight;
}

/**
 * Every valid width × height combination, in the order they appear in the
 * company codes (widths outer, heights inner). Note `a070` only pairs with
 * h140/h175/h210 and `a105` adds h105 in the real codes, but all listed combos
 * are physically valid panels, so we expose the full grid for selection.
 */
export const PANEL_TYPES: PanelType[] = PANEL_WIDTHS.flatMap((widthCm) =>
	PANEL_HEIGHTS.map((heightCm) => ({ widthCm, heightCm }))
);

/** Stable string key for a panel type, used as a <Select> value. */
export function panelTypeKey(t: { widthCm: number; heightCm: number }): string {
	return `${t.widthCm}x${t.heightCm}`;
}

/** Human label, e.g. "70 × 140 cm". */
export function panelTypeLabel(t: { widthCm: number; heightCm: number }): string {
	return `${t.widthCm} × ${t.heightCm} cm`;
}

/** Parse a "70x140" key back into dimensions, validating against the catalog. */
export function parsePanelTypeKey(key: string): PanelType | null {
	const [w, h] = key.split('x').map(Number);
	const match = PANEL_TYPES.find((t) => t.widthCm === w && t.heightCm === h);
	return match ?? null;
}

export function isPanelSide(value: unknown): value is PanelSide {
	return value === 'left' || value === 'right';
}
