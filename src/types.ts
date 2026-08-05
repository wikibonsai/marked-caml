// option types

export interface OptAttr {
  render?: boolean;
}

export interface OptCssNames {
  attr?: string;
  attrbox?: string;
  attrItem?: string;
}

export interface CamlOptions {
  // metadata functions
  addAttr?: (key: string, value: string) => void;
  // render opts
  attrs: OptAttr;
  cssNames: OptCssNames;
}
