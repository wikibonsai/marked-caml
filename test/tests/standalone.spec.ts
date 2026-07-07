import assert from 'node:assert/strict';

import { Marked } from 'marked';
import camlExtension from '../../src';


// standalone: marked-wikirefs is NOT co-registered. caml does NOT resolve wikirefs —
// a wiki-valued attribute renders as a plain string span (the 'string' type class)
// showing the literal [[fname]]. (caml + wikirefs interop, where wikirefs upgrades
// these to links, is covered in marked-wikirefs.)
describe('caml standalone (no wikirefs) wiki attr values', () => {

  it('renders a wiki attr value as a plain string span', () => {
    const md = new Marked(camlExtension());
    const html: string = md.parse(':attrtype::[[fname-a]]\n') as string;
    assert.ok(
      html.includes('<span class="attr string attrtype">[[fname-a]]</span>'),
      `expected a wiki string span, got:\n${html}`,
    );
    assert.ok(!/href=/.test(html), `expected no href, got:\n${html}`);
    assert.ok(!html.includes('data-wikiref'), 'expected no hand-off attribute');
  });

  it('ignores any resolvers passed to caml (caml never resolves wikirefs)', () => {
    const md = new Marked(camlExtension({
      resolveHtmlHref: (f: string) => '/' + f,
      resolveHtmlText: (f: string) => f,
    } as any));
    const html: string = md.parse(':attrtype::[[fname-a]]\n') as string;
    assert.ok(
      html.includes('<span class="attr string attrtype">[[fname-a]]</span>'),
      `expected a wiki string span (resolvers ignored), got:\n${html}`,
    );
    assert.ok(!/href=/.test(html), 'no href even with resolvers');
  });

});
