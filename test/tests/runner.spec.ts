import assert from 'node:assert/strict';

import type { CamlValData } from 'caml-mkdn';

import { Marked } from 'marked';
import camlExtension from '../../src';
import { attributeCollection } from '../../src/lib/caml';

import type { CamlTestCase } from 'caml-spec';
import { camlCases } from 'caml-spec';
// wiki-value resolvers from the shared wikirefs-spec fixture data — a caml wiki attr
// value is a wikiref, resolved the same way wikirefs tests resolve.
import { makeMockOptsForRenderOnly } from 'wikirefs-spec';


// marked-specific HTML adjustments:
// - preserves leading whitespace in paragraphs (markdown-it strips it)
// - multi-line attrs are preprocessed first, so they appear before regular
//   attrs in the attrbox (different order from markdown-it which preserves
//   source order)
function markedifyHtml(descr: string, html: string): string {
  if (descr === '[[wikirefs]]; unprefixed; single; [[wikilinks]]; should not be processed here') {
    return html.replace('<p>attribute ::</p>', '<p> attribute ::</p>');
  }
  // adjacent tests: marked preprocesses multi-line attrs first,
  // so they appear before regular attrs in the attrbox
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
        // create a fresh marked instance for each test; shared wikirefs-spec
        // resolvers so wiki attr <a> hrefs + titles match caml-spec's expected output
        const md = new Marked(camlExtension(makeMockOptsForRenderOnly()));
        const mkdn: string = test.mkdn;
        const expdHTML: string = markedifyHtml(test.descr, test.html);
        const actlHTML: string = md.parse(mkdn) as string;
        assert.strictEqual(actlHTML, expdHTML);
        // data assertions
        if (test.data && test.data.parse) {
          const expdParse = test.data.parse;
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

describe('marked-caml', () => {

  describe('render; mkdn -> html', () => {

    run('caml-spec', camlCases);

  });

  describe('state management', () => {

    it('consecutive parses should reset attributeCollection', () => {
      // first parse
      const md1 = new Marked(camlExtension());
      md1.parse(':title::First Document\n');
      assert.ok(attributeCollection['title'], 'first parse should have "title"');
      assert.strictEqual(attributeCollection['title'][0].string, 'First Document');

      // second parse (preprocess hook should reset attributeCollection)
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
      const keyCount1: number = Object.keys(attributeCollection).length;

      md1.parse(':shape::circle\n');
      assert.ok(attributeCollection['shape'], 'should have "shape" after second parse');
      assert.strictEqual(attributeCollection['color'], undefined, '"color" should be gone after second parse');
      assert.strictEqual(attributeCollection['size'], undefined, '"size" should be gone after second parse');
      assert.strictEqual(Object.keys(attributeCollection).length, 1, 'should only have 1 key after second parse');
    });

  });

  // enrich seam: without a resolver, caml must NOT fabricate a wiki link — it emits an
  // INERT marker (attr classes + data-wikiref) for a co-registered marked-wikirefs to
  // resolve in a later postprocess. See caml-wikiref-enrich-seam.
  describe('wiki attr value: inert marker (no resolver)', () => {

    it('emits an inert data-wikiref marker, not a fabricated href', () => {
      const md = new Marked(camlExtension());
      const html: string = md.parse(':linktype::[[fname-a]]\n') as string;
      assert.ok(html.includes('data-wikiref="fname-a"'), 'should carry the data-wikiref marker');
      assert.ok(html.includes('[[fname-a]]'), 'should keep the [[brackets]] literal (inert)');
      assert.ok(html.includes('class="attr wiki reftype__linktype"'), 'caml keeps attr-context classes');
      assert.ok(!/href=/.test(html), 'must NOT fabricate an href');
    });

    it('still resolves standalone when a resolver IS explicitly passed (legacy)', () => {
      const md = new Marked(camlExtension({
        resolveHtmlHref: (f: string) => '/' + f,
        resolveHtmlText: (f: string) => f,
      } as any));
      const html: string = md.parse(':linktype::[[fname-a]]\n') as string;
      assert.ok(html.includes('href="/fname-a"'), 'explicit resolver -> resolved link');
      assert.ok(!html.includes('data-wikiref'), 'resolved path emits no inert marker');
    });

  });

});
