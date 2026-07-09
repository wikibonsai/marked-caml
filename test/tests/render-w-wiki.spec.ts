import assert from 'node:assert/strict';

import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import camlExtension from '../../src';
import wikirefsExtension from 'marked-wikirefs';

import type { CamlTestCase } from 'caml-spec';
import { camlCases } from 'caml-spec';
import type { WikiRefTestCase } from 'wikirefs-spec';
import { wikiAttrCases, makeMockOptsForRenderOnly } from 'wikirefs-spec';


// caml + wikirefs co-registered. caml owns the attrbox (wikirefs stands down — caml's
// preprocess extracts the attr block first, so wikirefs' wikiattr hook finds nothing);
// caml emits string spans for wiki values and wikirefs upgrades them to resolved links.
// Runs the shared primitives (camlCases — identical output to caml-alone, a stand-down
// regression) + the resolved wiki cases (wikiAttrCases). marked registers caml LAST so its
// hooks run first (marked runs hooks in reverse registration order). The dual is async
// (wikirefs' embed hook is async), so parses are awaited.
interface RenderCase { mkdn: string; html: string; descr?: string; }

// marked HTML adjustments (marked preserves leading whitespace + preprocesses multi-line
// attrs first, so they appear before regular attrs in the attrbox).
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

function run(contextMsg: string, tests: RenderCase[]): void {
  context(contextMsg, () => {
    let i: number = 0;
    for (const test of tests) {
      const desc: string = `[${('00' + (++i)).slice(-3)}] ` + (test.descr || '');
      it(desc, async () => {
        // caml registered LAST → its preprocess runs first (marked reverse hook order).
        const md = new Marked(markedFootnote(), wikirefsExtension(makeMockOptsForRenderOnly()), camlExtension());
        const expdHTML: string = markedifyHtml(test.descr || '', test.html);
        const actlHTML: string = (await md.parse(test.mkdn)) as string;
        assert.strictEqual(actlHTML, expdHTML);
      });
    }
  });
}

describe('marked-caml: caml + wikirefs', () => {

  before(() => {
    // in the caml + wikirefs dual, caml's preprocess disrupts marked-footnote's footnote
    // formation on the attr-in-footnote-def line, so the 2 gfm-footnote fixtures render as
    // plain text + a body wikilink (not a footnote). Override with the dual's actual output.
    wikiAttrCases.forEach((testcase: WikiRefTestCase) => {
      if (testcase.descr === 'wikiattr; unprefixed; w/ other mkdn constructs; nested; gfm; footnote') {
        testcase.html = '<p>[^fn]\n[^fn]<a class="wiki link type reftype__attrtype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></p>\n';
      }
      if (testcase.descr === 'wikiattr; prefixed; w/ other mkdn constructs; nested; gfm; footnote') {
        testcase.html = '<p>[^fn]\n[^fn]: <a class="wiki link type reftype__attrtype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></p>\n';
      }
    });
  });

  it('wikirefs stands down: caml owns the attrbox (single attrbox, wiki value resolved)', async () => {
    const md = new Marked(markedFootnote(), wikirefsExtension(makeMockOptsForRenderOnly()), camlExtension());
    const html: string = (await md.parse(':attrtype::[[fname-a]]\n')) as string;
    assert.strictEqual((html.match(/<aside class="attrbox">/g) || []).length, 1, 'exactly one attrbox (no double)');
    assert.ok(html.includes('<a class="attr wiki reftype__attrtype"'), 'wiki value resolved by wikirefs');
  });

  describe('render', () => {

    run('mkdn -> html; primitives (same output as caml alone)', camlCases as RenderCase[]);
    run('mkdn -> html; wiki values resolved by wikirefs', wikiAttrCases as RenderCase[]);

  });

});
