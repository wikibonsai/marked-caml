import { defu } from 'defu';

import type { MarkedExtension } from 'marked';
import type { CamlOptions } from './types';
import { caml } from './lib/caml';


export default function camlExtension(opts: Partial<CamlOptions> = {}): MarkedExtension {
  // Set default options
  const defaults: CamlOptions = {
    attrs: {
      render: true,
      title: 'Attributes',
    },
    cssNames: {
      attrbox: 'attrbox',
      attrItem: 'attr-item',
      attr: 'attr',
      wiki: 'wiki',
      invalid: 'invalid',
      reftype: 'reftype__',
      doctype: 'doctype__',
    },
    // NB: no default resolvers here — and none are needed. caml does NOT resolve
    // wikirefs itself: it owns the attrbox and emits unresolved wiki markers that a
    // co-registered marked-wikirefs resolves in a later postprocess (the enrich
    // hand-off — see caml-wikiref-handoff / ./lib/caml). Resolvers live on
    // wikirefsExtension() ONLY; camlExtension() takes none. (Legacy: if resolvers
    // ARE passed here, caml resolves standalone — for caml-only consumers.)
  };
  // defu(opts, defaults): user opts win, defaults fill gaps — parity with wikirefs
  const fullOpts: CamlOptions = defu(opts, defaults) as CamlOptions;
  const extension: MarkedExtension = caml(fullOpts);
  return extension;
}
