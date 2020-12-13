import { addFile, filetab, files } from './file';
import { log } from './log';
import * as Example from './example';

export var editor;

function registerMotoko() {
  monaco.languages.register({ id: 'motoko' });
  monaco.languages.setLanguageConfiguration('motoko', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },    
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "<", close: ">" },
    ],
  });
  monaco.languages.setMonarchTokensProvider('motoko', {
    defaultToken: '',
    tokenPostfix: '.mo',
    keywords: ['actor', 'and', 'async', 'assert', 'await', 'break', 'case', 'catch', 'class',
               'continue', 'debug', 'else', 'false', 'for', 'func', 'if', 'in', 'import',
               'module', 'not', 'null', 'object', 'or', 'label', 'let', 'loop', 'private',
               'public', 'return', 'shared', 'try', 'throw', 'debug_show', 'query', 'switch',
               'true', 'type', 'var', 'while', 'stable', 'flexible', 'system'
              ],
    accessmodifiers: ['public', 'private', 'shared'],
    typeKeywords: ['Any', 'None', 'Null', 'Bool', 'Int', 'Int8', 'Int16', 'Int32', 'Int64',
                   'Nat', 'Nat8', 'Nat16', 'Nat32', 'Nat64', 'Word8', 'Word16', 'Word32', 'Word64',
                   'Float', 'Char', 'Text', 'Blob', 'Error', 'Principal'
                  ],
    operators: ['=', '<', '>', ':', '<:', '?', '+', '-', '*', '/', '%', '**', '&', '|', '^',
                '<<', '>>', '#', '==', '!=', '>=', '<=', ':=', '+=', '-=', '*=', '/=',
                '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '#=', '->'
               ],
    symbols: /[=(){}\[\].,:;@#\_&\-<>`?!+*\\\/]/,
    // C# style strings
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        // identifiers and keywords
        [/[a-zA-Z_$][\w$]*/, { cases: { '@typeKeywords': 'keyword.type',
                                     '@keywords': 'keyword',
                                     '@default': 'identifier' } }],
        // whitespace
        { include: '@whitespace' },

        // delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator',
                                '@default'  : '' } } ],
        // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F_]+/, 'number.hex'],
        [/[0-9_]+/, 'number'],

        // delimiter: after number because of .\d floats
        [/[;,.]/, 'delimiter'],
        
        // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid' ],  // non-teminated string
        [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

        // characters
        [/'[^\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string','string.escape','string']],
        [/'/, 'string.invalid']
      ],

      comment: [
        [/[^\/*]+/, 'comment' ],
        [/\/\*/,    'comment', '@push' ],    // nested comment
        ["\\*/",    'comment', '@pop'  ],
        [/[\/*]/,   'comment' ]
      ],

      string: [
        [/[^\\"]+/,  'string'],
        [/@escapes/, 'string.escape'],
        [/\\./,      'string.escape.invalid'],
        [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/,       'comment', '@comment' ],
        [/\/\/.*$/,    'comment'],
      ],        
    },
  });
}

export function loadEditor() {
  const link = document.createElement('link');
  link.rel = "stylesheet";
  link.setAttribute('data-name', "vs/editor/editor.main");
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs/editor/editor.main.min.css';
  document.getElementsByTagName('head')[0].appendChild(link);
  const script = document.createElement('script');
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs/loader.min.js";
  document.body.appendChild(script);
  script.addEventListener('load', () => {
    __non_webpack_require__.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs' }});
    window.MonacoEnvironment = {
      getWorkerUrl: function(workerId, label) {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min'
        };
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs/base/worker/workerMain.min.js');
        `
      )}`;
      }
    };
    __non_webpack_require__(["vs/editor/editor.main"], function () {
      registerMotoko();
      editor = monaco.editor.create(document.getElementById('editor'), {
        model: null,
        language: 'motoko',
        theme: 'vs',
        wordWrap: 'on',
        wrappingIndent: "indent",
        minimap: { enabled: false },
      });
      addFile('main.mo', Example.prog);
      addFile('types.mo', Example.type);
      addFile('pub.mo', Example.pub);
      addFile('sub.mo', Example.sub);
      addFile('fac.mo', Example.fac);
      addFile('test.mo', Example.matchers);      
      filetab.firstChild.click();
      log('Editor loaded.');
    });
  });
}

export function setMarkers(diags) {
  const markers = {};
  Object.keys(files).forEach(f => {
    markers[f] = [];
  });
  diags.forEach(d => {
    if (!markers[d.source]) {
      // possible if the error comes from external packages
      return;
    }
    const severity = d.severity === 1 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning;
    const marker = {
      startLineNumber: d.range.start.line+1,
      startColumn: d.range.start.character+1,
      endLineNumber: d.range.end.line+1,
      endColumn: d.range.end.character+1,
      message: d.message,
      severity,
    };
    markers[d.source].push(marker);
  });
  Object.entries(markers).forEach(([file, marks]) => {
    monaco.editor.setModelMarkers(files[file].model, 'moc', marks);
  });
}
