export default function camlExtension(opts: any = {}) {
  return {
    extensions: [
      {
        name: 'caml',
        level: 'block',
        start(src: string) {
          return src.indexOf(': ');
        },
        tokenizer(src: string) {
          if (src.startsWith(': ') && src.endsWith(' ::')) {
            return {
              type: 'caml',
              raw: src,
            };
          }
          return null;
        },
        renderer(token: any) {
          return '<dd>fname</dd>';
        },
      },
    ],
  };
}
