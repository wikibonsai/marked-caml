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

### `attrs`

These are options wikiattrs-specific options.

#### `attrs.enable`

A boolean property that toggles parsing and rendering wikiattrs on/off.

#### `attrs.render`

A boolean property that toggles rendering wikiattrs on/off. This is useful in the scenario where wikiattrs are used for metadata and not for display purposes; like a yaml-stand-in.

#### `attrs.title`

A string to be rendered in the wikiattrs' attrbox.

### `cssNames`

CSS classnames may be overridden here.

#### `cssNames.attr`

Classname for wikiattrs. Default is `attr`.

#### `cssNames.attrbox`

Classname for the wikiattr attrbox. Default is `attrbox`.

#### `cssNames.attrboxTitle`

Classname for the wikiattr attrbox title. Default is `attrbox-title`.
