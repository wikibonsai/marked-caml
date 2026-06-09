import assert from 'node:assert/strict';

import type { CamlValData } from 'caml-mkdn';

import { Marked } from 'marked';
import camlExtension from '../../src';
import { attributeCollection } from '../../src/lib/caml';

import type { CamlTestCase } from 'caml-spec';
import { camlCases } from 'caml-spec';


// Tests where marked's rendering differs from markdown-it due to parser behavior
// (marked preserves leading whitespace in paragraphs, markdown-it strips it)
const MARKED_HTML_OVERRIDES: Record<string, string> = {
  '[[wikirefs]]; unprefixed; single; [[wikilinks]]; should not be processed here':
    '<p> attribute ::</p>\n<p>[[wikilink]]</p>\n',
};

function run(contextMsg: string, tests: CamlTestCase[]): void {
  context(contextMsg, () => {
    let i: number = 0;
    for (const test of tests) {
      const desc: string = `[${('00' + (++i)).slice(-3)}] ` + (test.descr || '');
      it(desc, () => {
        // create a fresh marked instance for each test
        const md = new Marked(camlExtension());
        const mkdn: string = test.mkdn;
        const expdHTML: string = MARKED_HTML_OVERRIDES[test.descr] || test.html;
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

});
