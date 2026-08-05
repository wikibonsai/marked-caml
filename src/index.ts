import { defu } from 'defu';

import type { MarkedExtension } from 'marked';
import type { CamlOptions } from './types';
import { caml } from './lib/caml';


export default function camlExtension(opts: Partial<CamlOptions> = {}): MarkedExtension {
  // Set default options
  const defaults: CamlOptions = {
    attrs: {
      render: true,
    },
    cssNames: {
      attr: 'attr',
      attrbox: 'attrbox',
      attrItem: 'attr-item',
    },
    // NB: no resolvers here — caml does NOT resolve wikirefs. It owns the attrbox
    // and emits unresolved wiki markers that a co-registered marked-wikirefs resolves
    // in a later postprocess (the enrich hand-off — see caml-wikiref-handoff /
    // ./lib/caml). Resolvers live on wikirefsExtension() ONLY; camlExtension() takes
    // none. With no wikirefs present, wiki attr values render as literal [[fname]].
  };
  // defu(opts, defaults): user opts win, defaults fill gaps — parity with wikirefs
  const fullOpts: CamlOptions = defu(opts, defaults) as CamlOptions;
  const extension: MarkedExtension = caml(fullOpts);
  return extension;
}
