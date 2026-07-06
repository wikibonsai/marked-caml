import type { MarkedExtension } from 'marked';
import type { CamlValData } from 'caml-mkdn';
import type { CamlOptions } from '../types';

import * as CAML from 'caml-mkdn';


// exported for test access
export let attributeCollection: Record<string, CamlValData[]> = {};

export function caml(opts: CamlOptions): MarkedExtension {

  // helpers

  function addToCollection(key: string, item: CamlValData): void {
    if (!attributeCollection[key]) {
      attributeCollection[key] = [];
    }
    attributeCollection[key].push(item);
    // metadata callback
    if (opts.addAttr) {
      opts.addAttr(key, item.string);
    }
  }

  /**
   * Get display text for a resolved CAML value.
   * For multi-line strings (folded/literal), use the resolved value.
   * For everything else, use the string representation.
   */
  function displayText(item: CamlValData): string {
    let text: string;
    if (item.string && item.string.includes('\n')) {
      text = String(item.value);
    } else {
      text = item.string;
    }
    // convert newlines to <br> for proper HTML rendering of multi-line values
    return text.replace(/\n/g, '<br>');
  }

  /**
   * Render the attrbox HTML from the collected attributes.
   */
  function renderAttributeBox(): string {
    if (Object.keys(attributeCollection).length === 0) {
      return '';
    }

    let html: string = `<aside class="${opts.cssNames.attrbox || 'attrbox'}">\n`;
    html += '<dl>\n';

    for (const key in attributeCollection) {
      html += '<div class="' + (opts.cssNames.attrItem || 'attr-item') + '">\n';
      html += `<dt>${key}</dt>\n`;
      for (const item of attributeCollection[key]) {
        const keySlug: string = key.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        // wiki value: render as an <a> link using caml's own resolvers (or a plain
        // fallback). NOTE: this <a> intentionally DUPLICATES the anchor built by
        // marked-wikirefs, so marked-caml stays standalone (no marked-wikirefs dep).
        // Keep the class contract in sync with marked-wikirefs' wikiattr renderer:
        // https://github.com/wikibonsai/marked-wikirefs/blob/main/src/lib/wikiattr.ts
        if (item.type === 'wiki') {
          const fname: string = String(item.value).replace(/^\[\[/, '').replace(/\]\]$/, '');
          const resolveHref = opts.resolveHtmlHref;
          const resolveText = opts.resolveHtmlText;
          const resolveDoc = opts.resolveDocType;
          const baseUrl: string = opts.baseUrl ?? '';
          const href: string | undefined = resolveHref
            ? resolveHref(fname)
            : '/' + fname.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
          const text: string = (resolveText && resolveText(fname)) || fname;
          const doctype: string = resolveDoc ? (resolveDoc(fname) || '') : '';
          const attr: string = opts.cssNames.attr || 'attr';
          const wiki: string = opts.cssNames.wiki || 'wiki';
          if (href) {
            const classes: string[] = [attr, wiki, (opts.cssNames.reftype || 'reftype__') + keySlug];
            if (doctype.length > 0) {
              classes.push((opts.cssNames.doctype || 'doctype__') + doctype.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
            }
            const url: string = baseUrl + href;
            html += `<dd><a class="${classes.join(' ')}" href="${url}" data-href="${url}">${text}</a></dd>\n`;
          } else {
            html += `<dd><a class="${attr} ${wiki} ${opts.cssNames.invalid || 'invalid'}">[[${fname}]]</a></dd>\n`;
          }
          continue;
        }
        const display: string = displayText(item);
        html += `<dd><span class="${opts.cssNames.attr || 'attr'} ${item.type} ${keySlug}">${display}</span></dd>\n`;
      }
      html += '</div>\n';
    }

    html += '</dl>\n</aside>\n';
    return html;
  }

  /**
   * Parse a comma-separated value string into individual value items,
   * respecting quoted strings.
   */
  function parseCommaValues(valText: string): CamlValData[] {
    const items: CamlValData[] = [];
    let curVal: string = '';
    let inDoubleQuote: boolean = false;
    let inSingleQuote: boolean = false;
    for (const char of valText) {
      if ((!inDoubleQuote && !inSingleQuote) && (char === ',')) {
        const trimmed = curVal.trim();
        if (trimmed.length > 0) {
          items.push(CAML.resolve(trimmed));
        }
        curVal = '';
        continue;
      }
      if (/"/.test(char)) { inDoubleQuote = !inDoubleQuote; }
      if (/'/.test(char)) { inSingleQuote = !inSingleQuote; }
      curVal += char;
    }
    // last value
    const trimmed = curVal.trim();
    if (trimmed.length > 0) {
      items.push(CAML.resolve(trimmed));
    }
    return items;
  }

  /**
   * Parse mkdn-separated list items.
   * The listText starts with \n and contains lines like "- value".
   */
  function parseMkdnList(listText: string): CamlValData[] {
    const items: CamlValData[] = [];
    const lines: string[] = listText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = CAML.RGX.LINE.LIST_ITEM.exec(line);
      if (m) {
        const val: string = m[2];
        // Check if this list item is a multi-line block marker
        if (new RegExp('^' + CAML.RGX.MARKER.MLINE_STR.source + '$').test(val.trim())) {
          const marker: string = val.trim();
          const contentLines: string[] = [];
          const pendingEmpty: string[] = [];
          i++;
          while (i < lines.length) {
            const nextLine = lines[i];
            // continuation line must be indented
            if (/^\s+\S/.test(nextLine)) {
              // Flush pending empty lines
              contentLines.push(...pendingEmpty);
              pendingEmpty.length = 0;
              contentLines.push(nextLine);
              i++;
            } else if (nextLine.trim().length === 0) {
              // Could be trailing or in-between empty lines
              pendingEmpty.push(nextLine);
              i++;
            } else {
              i--; // back up so outer loop processes this line
              break;
            }
          }
          // Build resolve input
          // Use full trailing newlines for correct value, fix string to strip one
          const trailingNewlines = pendingEmpty.length > 0
            ? '\n'.repeat(pendingEmpty.length)
            : '';
          const trimmedTrailingNewlines = pendingEmpty.length > 1
            ? '\n'.repeat(pendingEmpty.length - 1)
            : '';
          const resolveInput: string = contentLines.length > 0
            ? marker + '\n' + contentLines.join('\n') + trailingNewlines
            : marker + '\n';
          const isKeepMode: boolean = marker.endsWith('+');
          const mlineItem: CamlValData = CAML.resolve(resolveInput);
          mlineItem.string = contentLines.length > 0
            ? marker + '\n' + contentLines.join('\n') + (isKeepMode ? trailingNewlines : trimmedTrailingNewlines)
            : marker + '\n';
          items.push(mlineItem);
        } else {
          items.push(CAML.resolve(val));
        }
      }
    }

    return items;
  }

  /**
   * Check if a position in the markdown is at the "top level"
   * (not inside a code block, blockquote, list item, etc.)
   */
  function isTop(content: string, position: number, matchedText: string): boolean {
    if (position < 0 || position >= content.length) {
      return false;
    }

    const firstLine: string = matchedText.split('\n')[0];

    // Bullet list item (- * +)
    if (/^ *[-*+]\s/.test(firstLine)) {
      return false;
    }
    // Numbered list item
    if (/^ *\d+[.)]\s/.test(firstLine)) {
      return false;
    }
    // Blockquote
    if (/^ *>\s/.test(firstLine)) {
      return false;
    }
    // Indented code block (4+ spaces or tab)
    if (/^ {4,}|\t/.test(firstLine)) {
      return false;
    }

    // Fenced code block
    if (content.includes('```')) {
      const beforeMatch = content.substring(0, position);
      const blockMarkers = (beforeMatch.match(/```/g) || []).length;
      if (blockMarkers % 2 !== 0) {
        return false;
      }
    }

    // Inline code span
    if (content.includes('`')) {
      const beforeMatch = content.substring(0, position);
      const backticksBefore = (beforeMatch.match(/`/g) || []).length;
      const afterMatch = content.substring(position);
      const backticksAfter = (afterMatch.match(/`/g) || []).length;
      if (backticksBefore % 2 !== 0 && backticksAfter > 0) {
        return false;
      }
    }

    return true;
  }

  return {
    extensions: [],
    hooks: {
      preprocess(markdown: string): string {
        // Reset attribute collection for each parse
        attributeCollection = {};

        // normalize CRLF -> LF so multi-line block-scalar detection (which keys off
        // a '\n' right after the >/| indicator + indented continuation lines) works
        // on files saved with Windows line endings. marked, unlike markdown-it,
        // doesn't normalize line endings before the preprocess hook.
        markdown = markdown.replace(/\r\n/g, '\n');

        let modified: string = markdown;
        const replacements: { start: number; end: number; replacement: string }[] = [];
        const handledPositions: Set<number> = new Set();

        // 1. First pass: handle multi-line single attributes (`:key:: >\n  content\n`)
        //    These are standalone CAML attrs whose value is a multi-line block
        const mlineSingleRgx = new RegExp(CAML.RGX.MLINE.SINGLE.source, 'gim');
        let mlineMatch: RegExpExecArray | null;

        while ((mlineMatch = mlineSingleRgx.exec(markdown)) !== null) {
          const fullMatch: string = mlineMatch[0];
          const key: string = mlineMatch[1].trim();
          const marker: string = mlineMatch[2];
          const content: string = mlineMatch[3];
          const start: number = mlineMatch.index;

          if (!isTop(markdown, start, fullMatch)) { continue; }

          // Build the string for resolve
          // The regex captures one trailing \n as "document end". For blocks with
          // meaningful trailing newlines (folded > trailing space), we need to preserve
          // the extra \n for resolve, then fix the string field.
          const trimmedContent: string = content.replace(/\n$/, '');
          const hasContentLines: boolean = /\S/.test(content);
          const isKeepMode: boolean = marker.endsWith('+');
          // Empty blocks: use trimmed content. Content blocks: use full content for value
          const resolveInput: string = hasContentLines
            ? ' ' + marker + '\n' + content
            : ' ' + marker + '\n' + trimmedContent;
          const item: CamlValData = CAML.resolve(resolveInput);
          // string field: keep mode preserves all trailing newlines; otherwise strip
          // the block's trailing newline(s). If another attr/paragraph follows, the
          // trailing blank line is a separator (strip all); at EOF, keep the single \n.
          const followedByContent: boolean = /\S/.test(markdown.slice(start + fullMatch.length));
          const stringContent: string = isKeepMode
            ? content
            : (followedByContent ? content.replace(/\n+$/, '') : content.replace(/\n$/, ''));
          item.string = ' ' + marker + '\n' + stringContent;
          addToCollection(key, item);

          handledPositions.add(start);
          replacements.push({
            start: start,
            end: start + fullMatch.length,
            replacement: '',
          });
        }

        // 2. Second pass: handle standard CAML attributes
        //    CAML.RGX.CAML matches both inline values and mkdn-separated lists
        const camlRgx = new RegExp(CAML.RGX.CAML.source, 'gim');
        let camlMatch: RegExpExecArray | null;

        while ((camlMatch = camlRgx.exec(markdown)) !== null) {
          const fullMatch: string = camlMatch[0];
          const key: string = camlMatch[1].trim();
          const valText: string = camlMatch[2];
          const start: number = camlMatch.index;

          // Skip if already handled as multi-line
          if (handledPositions.has(start)) { continue; }
          if (!isTop(markdown, start, fullMatch)) { continue; }

          // reject typed wikilinks: value has content after ']]'
          // e.g. ':linktype::[[target]].' is a typed wikilink, not a wikiattr
          if (valText && /\]\][^\],\s]/.test(valText)) { continue; }

          let items: CamlValData[];

          if (valText.startsWith('\n')) {
            // mkdn-separated list: value starts with newline followed by list items
            // Check if any list item ends with a multi-line marker (>, |, >-, >|)
            const lastListItem = valText.trimEnd().split('\n').pop() || '';
            const mkdnMlineCheck = new RegExp('^\\s*[+*-]\\s+' + CAML.RGX.MARKER.MLINE_STR.source + '\\s*$').exec(lastListItem);
            if (mkdnMlineCheck) {
              // The CAML regex didn't capture the indented content lines
              // Look ahead in source for continuation
              const afterMatch: string = markdown.substring(start + fullMatch.length);
              // Collect all the indented/empty lines after the CAML match
              let extraConsumed = 0;
              const extraText = afterMatch.replace(/^((?:\s+\S[^\n]*\n|\s*\n)*)/m, (match) => {
                extraConsumed = match.length;
                return match;
              });
              const mlineExtraContent = afterMatch.substring(0, extraConsumed);
              // Rebuild valText with the continuation content appended
              const extendedValText = valText + mlineExtraContent;
              items = parseMkdnList(extendedValText);
              // Update replacement to cover extra consumed content
              replacements.push({
                start: start,
                end: start + fullMatch.length + extraConsumed,
                replacement: '',
              });
              if (items.length > 0) {
                for (const item of items) {
                  addToCollection(key, item);
                }
              }
              continue;
            } else {
              items = parseMkdnList(valText);
            }
          } else {
            // inline value (single or comma-separated)
            // multi-line indicators in comma lists are treated as literal strings
            items = parseCommaValues(valText);
          }

          if (items.length === 0) { continue; }

          for (const item of items) {
            addToCollection(key, item);
          }

          replacements.push({
            start: start,
            end: start + fullMatch.length,
            replacement: '',
          });
        }

        // Apply replacements in reverse order
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
          modified =
            modified.substring(0, r.start) +
            r.replacement +
            modified.substring(r.end);
        }

        return modified;
      },

      postprocess(html: string): string {
        // Render attribute box
        const attrboxHtml: string = renderAttributeBox();
        const doRender: boolean = !!(opts.attrs && opts.attrs.render !== false);
        const hasAttrbox: boolean = html.includes(`class="${opts.cssNames?.attrbox || 'attrbox'}"`);

        const result: string = (doRender && attrboxHtml && !hasAttrbox)
          ? attrboxHtml + html
          : html;

        return result;
      },
    },
  };
}
