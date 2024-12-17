import assert from 'node:assert/strict';

// import type { CamlValData } from 'caml-mkdn';
// import type { CamlOptions } from '../../src/types';

import { marked } from 'marked';
import camlExtension from '../../src';

import type { CamlTestCase } from 'caml-spec';
import { camlCases } from 'caml-spec';


// setup

let env: any;
let mockOpts: any;// Partial<WikiRefsOptions>;
let md: typeof marked;

// function run(contextMsg: string, tests: WikiRefTestCase[]): void {
//   context(contextMsg, () => {
//     let i: number = 0;
//     for(const test of tests) {
//       const desc: string = `[${('00' + (++i)).slice(-3)}] ` + (test.descr || '');
//       it(desc, () => {
//         const mkdn: string = test.mkdn;
//         const expdHTML: string = test.html;
//         const actlHTML: string = md.render(mkdn, env);
//         assert.strictEqual(actlHTML, expdHTML);
//       });
//     }
//   });
// }

describe('marked-caml', () => {

  beforeEach(() => {
    md = marked.use(camlExtension());
    env = { absPath: '/tests/fixtures/file-with-caml-attrs.md' };
  });

  it(': hello world :: !', async () => {
    assert.strictEqual(md(': hello world :: \n'), '<p>: hello world :\n: </p>\n');
  });

  describe('render; mkdn -> html', () => {

    // run('caml-spec', camlCases);

  });

});
