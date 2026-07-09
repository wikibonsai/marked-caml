import assert from 'node:assert/strict';

import type { CamlValData } from 'caml-mkdn';

import { Marked } from 'marked';
import camlExtension from '../src';
import { attributeCollection } from '../src/lib/caml';

import type { CamlTestCase } from 'caml-spec';
import { camlCases, camlWithoutWikiRefsCases } from 'caml-spec';


// caml ALONE (no marked-wikirefs co-registered). caml never resolves wikirefs — a
// wiki-valued attribute renders as a plain string span (the 'string' type class) showing
// the literal [[fname]]. Runs the shared primitives (camlCases) + the standalone wiki
// cases (camlWithoutWikiRefsCases). caml + wikirefs is covered in render-w-wiki.spec.ts.

// marked-specific HTML adjustments:
// - preserves leading whitespace in paragraphs (markdown-it strips it)
// - multi-line attrs are preprocessed first, so they appear before regular attrs in the
//   attrbox (different order from markdown-it, which preserves source order)
function markedifyHtml(descr: string, html: string): string {
  if (descr === '[[wikirefs]]; unprefixed; single; [[wikilinks]]; should not be processed here') {
    return html.replace('<p>attribute ::</p>', '<p> attribute ::</p>');
  }
  if (descr.includes('adjacent') && html.includes('<dt>')) {
    return html.replace(
      /(<dl>\n)([\s\S]*?)(<\/dl>)/,
      (match, open, content, close) => {
        const items = content.split(/(?=<div class="attr-item">)/);
        const multiLine = items.filter((i: string) => i.includes('<br>'));
        const regular = items.filter((i: string) => !i.includes('<br>') && i.trim());
        return open + multiLine.join('') + regular.join('') + close;
      }
    );
  }
  return html;
}

function run(contextMsg: string, tests: CamlTestCase[]): void {
  context(contextMsg, () => {
    let i: number = 0;
    for (const test of tests) {
      const desc: string = `[${('00' + (++i)).slice(-3)}] ` + (test.descr || '');
      it(desc, () => {
        // fresh marked instance per test; caml takes no resolvers (it never resolves wikirefs).
        const md = new Marked(camlExtension());
        const expdHTML: string = markedifyHtml(test.descr, test.html);
        const actlHTML: string = md.parse(test.mkdn) as string;
        assert.strictEqual(actlHTML, expdHTML);
        // data assertions
        if (test.data && test.data.parse) {
          const expdParse: any = test.data.parse;
          for (const key in expdParse) {
            assert.ok(attributeCollection[key], `expected key "${key}" in attributeCollection`);
            const expdItems: CamlValData[] = expdParse[key];
            const actlItems: CamlValData[] = attributeCollection[key];
            assert.strictEqual(actlItems.length, expdItems.length, `item count mismatch for key "${key}"`);
            for (let j = 0; j < expdItems.length; j++) {
              assert.strictEqual(actlItems[j].type, expdItems[j].type, `type mismatch for "${key}"[${j}]`);
              assert.strictEqual(actlItems[j].string, expdItems[j].string, `string mismatch for "${key}"[${j}]`);
            }
          }
        }
      });
    }
  });
}

describe('marked-caml: caml alone (no wikirefs)', () => {

  describe('render; mkdn -> html', () => {

    run('caml-spec', camlCases);
    run('wiki values as string spans', camlWithoutWikiRefsCases);

  });

  describe('state management', () => {

    it('consecutive parses should reset attributeCollection', () => {
      const md1 = new Marked(camlExtension());
      md1.parse(':title::First Document\n');
      assert.ok(attributeCollection['title'], 'first parse should have "title"');
      assert.strictEqual(attributeCollection['title'][0].string, 'First Document');

      const md2 = new Marked(camlExtension());
      md2.parse(':author::Jane Doe\n');
      assert.ok(attributeCollection['author'], 'second parse should have "author"');
      assert.strictEqual(attributeCollection['title'], undefined, 'attributeCollection should NOT retain "title" from first parse');
    });

    it('attributeCollection should only contain keys from most recent parse', () => {
      const md1 = new Marked(camlExtension());
      md1.parse(':color::blue\n:size::large\n');
      assert.ok(attributeCollection['color'], 'should have "color"');
      assert.ok(attributeCollection['size'], 'should have "size"');

      md1.parse(':shape::circle\n');
      assert.ok(attributeCollection['shape'], 'should have "shape" after second parse');
      assert.strictEqual(attributeCollection['color'], undefined, '"color" should be gone after second parse');
      assert.strictEqual(attributeCollection['size'], undefined, '"size" should be gone after second parse');
      assert.strictEqual(Object.keys(attributeCollection).length, 1, 'should only have 1 key after second parse');
    });

  });

  // hand-off: caml never resolves/fabricates a wiki link — a wiki value renders like any
  // other value, a plain string span showing the literal [[fname]]. A co-registered
  // marked-wikirefs upgrades these spans to links. See caml-wikiref-handoff.
  describe('wiki attr value: string span', () => {

    it('renders a wiki value as a plain string span (no href, no marker)', () => {
      const md = new Marked(camlExtension());
      const html: string = md.parse(':linktype::[[fname-a]]\n') as string;
      assert.ok(html.includes('<span class="attr string linktype">[[fname-a]]</span>'), 'string span with [[fname]]');
      assert.ok(!/href=/.test(html), 'must NOT fabricate an href');
      assert.ok(!html.includes('data-wikiref'), 'no hand-off attribute in output');
    });

    it('ignores any resolvers passed to caml (caml never resolves wikirefs)', () => {
      const md = new Marked(camlExtension({
        resolveHtmlHref: (f: string) => '/' + f,
        resolveHtmlText: (f: string) => f,
      } as any));
      const html: string = md.parse(':attrtype::[[fname-a]]\n') as string;
      assert.ok(html.includes('<span class="attr string attrtype">[[fname-a]]</span>'), 'string span (resolvers ignored)');
      assert.ok(!/href=/.test(html), 'no href even with resolvers');
    });

  });

});
