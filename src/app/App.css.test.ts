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
});
