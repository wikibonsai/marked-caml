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
    // NB: no default resolvers here — wiki values reuse a co-registered
    // marked-wikirefs' resolvers (via getWikiRefsOpts) when caml's own aren't set,
    // so configuring wikirefs alone suffices. See renderAttributeBox in ./lib/caml.
  };
  // defu(opts, defaults): user opts win, defaults fill gaps — parity with wikirefs
  const fullOpts: CamlOptions = defu(opts, defaults) as CamlOptions;
  const extension: MarkedExtension = caml(fullOpts);
  return extension;
}
