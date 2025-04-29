import type { MarkedExtension } from 'marked';
import { merge } from 'lodash';
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
      attrboxTitle: 'attrbox-title',
      attr: 'attr',
    }
  };
  const fullOpts: CamlOptions = merge({}, defaults, opts);
  const extension: MarkedExtension = caml(fullOpts);
  return extension;
}
