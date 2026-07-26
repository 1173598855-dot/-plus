import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

declare const process: { cwd(): string };

const appCss = readFileSync(join(process.cwd(), 'src/app/App.css'), 'utf8');

function getRuleBody(selector: string): string {
  const selectorIndex = appCss.indexOf(`${selector} {`);
  if (selectorIndex === -1) return '';
  const bodyStart = appCss.indexOf('{', selectorIndex) + 1;
  const bodyEnd = appCss.indexOf('}', bodyStart);
  return appCss.slice(bodyStart, bodyEnd);
}

function getGridTemplateColumns(selector: string): string {
  return getRuleBody(selector).match(/grid-template-columns:\s*([^;]+);/)?.[1].trim() ?? '';
}

function getMediaBody(query: string): string {
  const mediaIndex = appCss.indexOf(`@media ${query}`);
  if (mediaIndex === -1) return '';
  const bodyStart = appCss.indexOf('{', mediaIndex) + 1;
  let depth = 1;
  for (let index = bodyStart; index < appCss.length; index += 1) {
    if (appCss[index] === '{') depth += 1;
    if (appCss[index] === '}') depth -= 1;
    if (depth === 0) return appCss.slice(bodyStart, index);
  }
  return '';
}

function getRuleBodyFromSource(source: string, selector: string): string {
  const selectorIndex = source.indexOf(`${selector} {`);
  if (selectorIndex === -1) return '';
  const bodyStart = source.indexOf('{', selectorIndex) + 1;
  const bodyEnd = source.indexOf('}', bodyStart);
  return source.slice(bodyStart, bodyEnd);
}

function splitGridTracks(template: string): string[] {
  const tracks: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of template) {
    if (/\s/.test(char) && depth === 0) {
      if (current.trim()) tracks.push(current.trim());
      current = '';
      continue;
    }

    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    current += char;
  }

  if (current.trim()) tracks.push(current.trim());
  return tracks;
}

function getCssVariable(name: string): string {
  return getRuleBody(':root').match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1] ?? '';
}

function relativeLuminance(hex: string): number {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

describe('App.css', () => {
  it('keeps list table columns aligned with the rendered cells', () => {
    const headerColumns = getGridTemplateColumns('.table-head');
    const rowColumns = getGridTemplateColumns('.table-row');

    expect(appCss).toContain('.table-head');
    expect(headerColumns).not.toBe('');
    expect(headerColumns).toBe(rowColumns);
    expect(splitGridTracks(headerColumns)).toHaveLength(8);
  });

  it('keeps list task metadata visible on narrow screens', () => {
    const mobileBody = getMediaBody('(max-width: 720px)');
    const mobileMetaRule = getRuleBodyFromSource(mobileBody, '.table-row > span');

    expect(mobileBody).toContain('.table-row > span');
    expect(mobileMetaRule).not.toContain('display: none');
    expect(mobileMetaRule).toContain('grid-column: 3');
  });

  it('constrains empty-state artwork without cropping it', () => {
    const artworkRule = getRuleBody('.empty-artwork');

    expect(artworkRule).toContain('width: min(180px, 55%)');
    expect(artworkRule).toContain('max-height: 128px');
    expect(artworkRule).toContain('object-fit: contain');
  });

  it('uses a non-shadow visible selection state for list rows', () => {
    const selectedRowRule = getRuleBody('.table-row.selected');

    expect(selectedRowRule).not.toContain('box-shadow');
    expect(selectedRowRule).toContain('outline: 2px solid var(--accent)');
  });

  it('reserves a compact rail and full-width task canvas', () => {
    expect(getGridTemplateColumns('.workspace')).toBe('280px minmax(0, 1fr)');
    expect(getGridTemplateColumns('.metric-grid')).toBe('repeat(4, minmax(0, 1fr))');
    expect(getGridTemplateColumns('.content-grid')).toBe('minmax(0, 1fr)');
  });

  it('keeps filter overflow inside the work band and details in an overlay layer', () => {
    expect(getRuleBody('.workband-filters')).toContain('overflow-x: auto');
    expect(getRuleBody('.detail-layer')).toContain('position: fixed');
    expect(getRuleBody('.detail')).toContain('width: min(360px, calc(100vw - 32px))');
  });

  it('collapses optional controls on mobile without horizontal page overflow', () => {
    const mobileBody = getMediaBody('(max-width: 720px)');
    expect(getRuleBody('body')).toContain('overflow-x: hidden');
    expect(getRuleBodyFromSource(mobileBody, '.filter-strip:not(.mobile-expanded)')).toContain('display: none');
    expect(getRuleBodyFromSource(mobileBody, '.detail')).toContain('width: 100%');
  });

  it('keeps backup actions readable in the compact rail', () => {
    const intermediateBody = getMediaBody('(max-width: 1180px)');
    expect(getRuleBodyFromSource(intermediateBody, '.backup-actions')).toContain('grid-template-columns: 1fr');
  });

  it('keeps mobile task controls at least 40px on both axes', () => {
    const mobileBody = getMediaBody('(max-width: 720px)');
    const viewButtonRule = getRuleBodyFromSource(mobileBody, '.view-switch button');
    const selectTaskRule = getRuleBodyFromSource(mobileBody, '.select-task');
    const iconButtonRule = getRuleBodyFromSource(mobileBody, '.icon-button');

    expect(viewButtonRule).toContain('min-height: 40px');
    expect(selectTaskRule).toContain('width: 40px');
    expect(selectTaskRule).toContain('height: 40px');
    expect(iconButtonRule).toContain('width: 40px');
    expect(iconButtonRule).toContain('height: 40px');
    expect(getRuleBodyFromSource(mobileBody, '.task-card')).toContain('grid-template-columns: 40px 40px minmax(0, 1fr)');
    expect(getRuleBodyFromSource(mobileBody, '.table-row')).toContain('grid-template-columns: 40px 40px minmax(0, 1fr)');
    expect(getRuleBodyFromSource(mobileBody, '.workspace-status .clear-filter')).toContain('min-height: 40px');
  });

  it('shows a visible focus ring on composite search and file controls', () => {
    for (const selector of ['.search-box:focus-within', '.file-action:focus-within']) {
      const focusRule = getRuleBody(selector);
      expect(focusRule).toContain('border-color: var(--accent)');
      expect(focusRule).toContain('box-shadow: 0 0 0 3px');
    }
  });

  it('keeps secondary and warning text contrast at or above 4.5', () => {
    const mutedSoft = getCssVariable('--muted-soft');
    const warning = getCssVariable('--warning');
    const warningSoft = getCssVariable('--warning-soft');
    const mutedBackgrounds = [getCssVariable('--surface-raised'), getCssVariable('--surface-panel')];
    const mutedWorstCase = Math.min(...mutedBackgrounds.map((background) => contrastRatio(mutedSoft, background)));
    const warningWorstCase = contrastRatio(warning, warningSoft);

    expect(mutedWorstCase).toBeGreaterThanOrEqual(4.5);
    expect(warningWorstCase).toBeGreaterThanOrEqual(4.5);
  });
});
