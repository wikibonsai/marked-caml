import assert from 'node:assert/strict';
import sinon from 'sinon';

import { Marked } from 'marked';
import camlExtension from '../src';
// the wikirefs sibling is a devDep for the co-registration (dual) case ONLY. gate on it:
// if it isn't installed, the dual case SKIPS rather than crashing on a missing import.
/* eslint-disable @typescript-eslint/no-var-requires */
let wikirefsExtension: any;
try { const m = require('marked-wikirefs'); wikirefsExtension = (m && m.default) || m; } catch { /* sibling absent — dual case skips */ }
/* eslint-enable @typescript-eslint/no-var-requires */
const hasWikirefsSibling: boolean = !!wikirefsExtension;

import { makeMockOptsForRenderOnly } from 'wikirefs-spec';


let mockOpts: any;
let fakeAddAttr: any;

// metadata: the addAttr() callback. marked-caml's signature is (key, value) — NO env (env is
// a markdown-it construct for cross-stage value passing). caml reports a wiki value as the
// literal '[[fname]]', both standalone AND co-registered with wikirefs — caml never resolves;
// the hand-off is text-based (marked-wikirefs re-scans the span text). See caml-wikiref-handoff.
describe('metadata', () => {

  beforeEach(() => {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    function mockAddAttr(key: string, value: string): void { return; }
    mockOpts = {
      addAttr: mockAddAttr,
    };
    fakeAddAttr = sinon.replace(mockOpts, 'addAttr', sinon.fake.returns({}));
  });

  afterEach(() => {
    sinon.restore();
  });

  const testMetaData = (params: any) =>
    async () => {
      const exts: any[] = params.wikirefs
        ? [wikirefsExtension(makeMockOptsForRenderOnly()), camlExtension(mockOpts)]
        : [camlExtension(mockOpts)];
      await new Marked(...exts).parse(params.mkdn);
      assert.strictEqual(fakeAddAttr.called, true);
      assert.deepStrictEqual(fakeAddAttr.getCall(0).args, params.args);
    };

  describe('', () => {

    it('basic', testMetaData({
      mkdn: 'attribute::this-is-a-string\n',
      args: ['attribute', 'this-is-a-string'],
    }));

    it('wiki value; caml alone', testMetaData({
      mkdn: 'attrtype::[[fname-a]]\n',
      args: ['attrtype', '[[fname-a]]'],
    }));

    (hasWikirefsSibling ? it : it.skip)('wiki value; caml + wikirefs', testMetaData({
      wikirefs: true,
      mkdn: 'attrtype::[[fname-a]]\n',
      args: ['attrtype', '[[fname-a]]'],
    }));

  });

});
