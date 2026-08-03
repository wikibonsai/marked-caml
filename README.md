# marked-caml

[![A WikiBonsai Project](https://img.shields.io/badge/%F0%9F%8E%8B-A%20WikiBonsai%20Project-brightgreen)](https://github.com/wikibonsai/wikibonsai)
[![NPM package](https://img.shields.io/npm/v/marked-caml)](https://npmjs.org/package/marked-caml)

A marked plugin to process [caml](https://github.com/wikibonsai/caml-mkdn) -- Colon Attribute Markup Language.

Note that this plugin only parses the input -- it is up to you to handle and store metadata.

🕸 Weave a semantic web in your [🎋 WikiBonsai](https://github.com/wikibonsai/wikibonsai) digital garden.

## Install

Install with [npm](https://docs.npmjs.com/cli/v9/commands/npm-install):

```
$ npm install marked-caml
```

## Use

```js
import { marked } from 'marked';
import camlExtension from 'marked-caml';

// Add the caml extension to marked
marked.use(camlExtension(options));

// Now parse markdown with caml attributes
const html = marked.parse(':caml::attributes\n');
```

Require style imports work as well:

```js
const camlExtension = require('marked-caml');

// if you encounter issues, try:
const camlExtension = require('marked-caml').default;

```

## Syntax

For syntax specifications, see the [caml-spec](https://github.com/caml-mkdn/tree/main/spec) repo.

## Options

### `addAttr: (key: string, value: string) => void`

Called once per collected caml attribute (key/value pair); use for metadata or indexing. A wiki-valued attribute is reported with the literal `[[fname]]` as the value — caml does not resolve wikirefs (a co-registered `marked-wikirefs` resolves the rendered value in a later pass; see the caml ⇄ wikirefs hand-off).

### `attrs`

These are attrbox-specific options.

#### `attrs.enable`

A boolean property that toggles parsing and rendering wikiattrs on/off.

#### `attrs.render`

A boolean property that toggles rendering wikiattrs on/off. This is useful in the scenario where wikiattrs are used for metadata and not for display purposes; like a yaml-stand-in.

### `cssNames`

CSS classnames may be overridden here.

#### `cssNames.attr`

Classname for wikiattrs. Default is `attr`.

#### `cssNames.attrbox`

Classname for the wikiattr attrbox. Default is `attrbox`.
