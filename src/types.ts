// option types

export interface OptAttr {
  enable?: boolean;
  render?: boolean;
  title?: string;
}

export interface OptCssNames {
  attr?: string;
  wiki?: string;
  invalid?: string;
  reftype?: string;
  doctype?: string;
  attrbox?: string;
  attrItem?: string;
  attrboxTitle?: string;
}

export interface CamlOptions {
  // metadata functions
  addAttr?: (key: string, value: string) => void;
  // render opts
  attrs: OptAttr;
  cssNames: OptCssNames;
  // wiki value rendering — mirrors the marked-wikirefs resolvers so caml renders
  // wiki attr values as <a> links; override to match the co-installed wikirefs.
  resolveHtmlHref?: (fname: string) => string | undefined;
  resolveHtmlText?: (fname: string) => string | undefined;
  resolveDocType?: (fname: string) => string | undefined;
  baseUrl?: string;
}
