import type { MarkedExtension } from 'marked';
import type { CamlOptions } from './types';
import { caml } from './lib/caml';


function deepMerge(target: any, ...sources: any[]): any {
  const result = { ...target };
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
          && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}


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
  const fullOpts: CamlOptions = deepMerge(defaults, opts);
  const extension: MarkedExtension = caml(fullOpts);
  return extension;
}
