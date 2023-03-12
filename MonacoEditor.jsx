/*
based on
https://github.com/solidjs/solid-playground/blob/master/src/components/editor/index.tsx

TODO

* darkmode detection for darkreader -> css parent-selector: [data-darkreader-mode="dynamic"]
  https://github.com/darkreader/darkreader/issues/4342#issuecomment-969557799

  div.highlight {
    background-color: lightgreen;
  }

  [data-darkreader-mode="dynamic"] div.highlight {
    background-color: darkgreen;
  }

* use folding-ranges from tree-sitter. stupid vscode parser breaks on "wrong" indent

* goldenlayout.js ?? something flexible, customizable

*/

import {
  //Component,
  createEffect,
  onMount,
  //JSX,
  Show,
  createSignal,
  onCleanup,
  mergeProps,
} from 'solid-js';


import { createStore } from 'solid-js/store';


// TODO? move this import to frontend/src/index.jsx -> import only once ...
import './webworkers.js';

import { glob as globalStyle } from "solid-styled-components";

import * as Monaco from 'monaco-editor';

/*
this is working
//import * as MonacoTreeSitter from "monaco-tree-sitter";
import * as MonacoTreeSitter from "./monaco-tree-sitter";
import MonacoTreeSitterGrammarNix from "./monaco-tree-sitter/grammars/nix.json";
import MonacoThemeTomorrow from "./monaco-tree-sitter/themes/tomorrow";
MonacoTreeSitter.Theme.load(MonacoThemeTomorrow);
*/

// TODO support lezer-parser and tree-sitter
// lezer-parser is preferred because it is pure javascript
// tree-sitter requires WASM so its less portable, but faster

// TODO factor out to props.parser?
import * as MonacoLezerParser from "./monaco-lezer-parser";
import MonacoLezerParserGrammarNix from "./monaco-lezer-parser/grammars/nix.json";
//import { parser as LezerParserNix } from "lezer-parser-nix"
import { parser as LezerParserNix } from "./lezer-parser-nix"

import {
  styleTags as CodemirrorHighlightStyleTags,
  tags as CodemirrorHighlightTags,
} from "@lezer/highlight"

import {
  /*
  LRLanguage, LanguageSupport,
  delimitedIndent, flatIndent, continuedIndent, indentNodeProp,
  */
  foldNodeProp,
  indentNodeProp,
  foldInside as CodemirrorLanguageFoldInside
} from "@codemirror/language"

import MonacoThemeTomorrow from "./monaco-lezer-parser/themes/tomorrow";

MonacoLezerParser.Theme.load(MonacoThemeTomorrow);

// FIXME
//import MonacoThemeTomorrow from "./monaco-lezer-parser/themes/tomorrow";

/* this is working
import TreeSitter from 'web-tree-sitter';
//import TreeSitterNixWasm from './tree-sitter-nix.wasm'; // FIXME no such file
const TreeSitterNixWasm = '/tree-sitter-nix.wasm';
*/

/** @typedef {import("monaco-editor")} Monaco */

/**
 * @param {object} props
 * @param {Monaco.editor.IStandaloneEditorConstructionOptions} props.options
 */

export default function MonacoEditor(props) {

  const finalProps = mergeProps({ options: {}, showActionBar: true }, props);

  let parent;
  let editor;

  //const { zoomState } = useZoom();

  //const model = () => Monaco.editor.getModel(Monaco.Uri.parse(finalProps.url));
  //const model = () => Monaco.editor.createModel(code, "typescript", Monaco.Uri.parse("file:///main.tsx"));
  //const model = () => Monaco.editor.createModel("hello world", "plain", Monaco.Uri.parse("file:///main.txt"));
  //const model = () => Monaco.editor.createModel("hello world", "javascript");
  //const model = () => Monaco.editor.createModel("if true then true else false", "nix", Monaco.Uri.parse("file:///default.nix"));
  //const model = () => Monaco.editor.getModel(Monaco.Uri.parse("file:///default.nix")) || Monaco.editor.createModel(props.options.value, "nix", Monaco.Uri.parse("file:///default.nix"));
  const model = () => {
    if (Monaco.editor.getModels().length == 0) {
      // fix: ModelService: Cannot add model because it already exists
      // https://github.com/atularen/ngx-monaco-editor/issues/48
      // the model URI is used to identify editor instances
      Monaco.editor.createModel(finalProps.options.value, "nix", Monaco.Uri.parse("file:///unique-editor-id.nix"))
    }
  };

  const [format, setFormat] = createSignal(false);
  function formatCode() {
    if (!format()) {
      editor.getAction('editor.action.formatDocument').run();
      editor.focus();
    }
    setFormat(true);
    setTimeout(setFormat, 750, false);
  }

  const [state, setState] = createStore({ tree: null });

  const [clip, setClip] = createSignal(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(editor.getValue()).then(() => {
      setClip(true);
      setTimeout(setClip, 750, false);
    });
  }

  if (finalProps.formatter) {
    Monaco.languages.registerDocumentFormattingEditProvider('typescript', {
      provideDocumentFormattingEdits: async (model) => {
        finalProps.formatter.postMessage({
          event: 'FORMAT',
          code: model.getValue(),
          pos: editor.getPosition(),
        });
        return new Promise((resolve, reject) => {
          finalProps.formatter.addEventListener(
            'message',
            ({ data: { event, code } }) => {
              switch (event) {
                case 'RESULT':
                  resolve([
                    {
                      range: model.getFullModelRange(),
                      text: code,
                    },
                  ]);
                  break;
                default:
                  reject();
              }
            },
            { once: true },
          );
        });
      },
    });
  }

  // FIXME set MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker

  const setupEditor = () => {
    console.log('MonacoEditor: finalProps.options', finalProps.options)
    //editor = Monaco.editor.create(parent, finalProps);
    editor = Monaco.editor.create(parent, {
      //model: null,
      //model: model(),
      language: "text", // disable textmate highlighting
      //theme: 'vs-dark-plus',
      //theme: 'vs-dark',
      automaticLayout: true,
      readOnly: finalProps.disabled,
      //fontSize: zoomState.fontSize,
      lineDecorationsWidth: 5,
      lineNumbersMinChars: 3,
      padding: { top: 15 },
      //minimap: { enabled: finalProps.minimap, },

      ...finalProps.options,
    });

    // this will disable onEditorContentChange in monaco-tree-sitter/src/index.js?
    /*
    editor.onDidChangeModelContent((update) => {
      //console.log('editor.onDidChangeModelContent');
      console.log(update);
      //console.log(editor.getValue());
      //if (finalProps.onDocChange) finalProps.onDocChange(editor.getValue());
    });
    */

    if (props.ref) {
      // callback to parent component
      props.ref(editor);
    }
  };
  // Initialize Monaco
  onMount(async () => {
    /* this is working
    console.log('Initialize TreeSitter')
    await TreeSitter.init(); // TODO load wasm from relative path ./tree-sitter.wasm
    */

    /* this is working
    // Load the language's grammar rules
    const language = new MonacoTreeSitter.Language(MonacoTreeSitterGrammarNix);
    
    // Load the language's parser library's WASM binary
    await language.init(TreeSitterNixWasm, TreeSitter);
    //TreeSitterNix = await TreeSitter.Language.load('./tree-sitter-nix.wasm'); // served from vite-plugin-tree-sitter
    */

    // TODO?
    //const parsers = Array.isArray(props.parser) ? props.parser : [props.parser];
    //for (const parser of parsers) {
    //}

    const lezerParserNixOptions = {
      props: [
        CodemirrorHighlightStyleTags({
          // map parser tokens to https://codemirror.net/6/docs/ref/#highlight.tags
          Identifier: CodemirrorHighlightTags.variableName,
          Boolean: CodemirrorHighlightTags.bool,
          String: CodemirrorHighlightTags.string,
          StringContent: CodemirrorHighlightTags.string,
          StringBlock: CodemirrorHighlightTags.string,
          StringBlockContent: CodemirrorHighlightTags.string,
          Comment: CodemirrorHighlightTags.lineComment,
          CommentBlock: CodemirrorHighlightTags.blockComment,
          Braces: CodemirrorHighlightTags.paren,
          URI: CodemirrorHighlightTags.url,
        }),
        indentNodeProp.add({
          Application: context => context.column(context.node.from) + context.unit
        }),
        foldNodeProp.add({
          Application: CodemirrorLanguageFoldInside
        })
      ]
    };

    // monaco-lezer-parser/src/language.js
    // Load the language's grammar rules
    // TODO switch parser type: lezer-parser vs tree-sitter
    console.log('MonacoEditor: parser type', typeof(MonacoLezerParser))
    const language = new MonacoLezerParser.Language(MonacoLezerParserGrammarNix);
    // the init method allows to run async code, for example to load WASM
    // TODO expose init args to props.parser.language[i].initArgs
    await language.init(LezerParserNix, lezerParserNixOptions);

    /* debug
    const TreeSitterNix = await TreeSitter.Language.load(TreeSitterNixWasm); // served from vite-plugin-tree-sitter

    const parser = new TreeSitter();
    parser.setLanguage(TreeSitterNix);

    const sourceCode = 'if true then true else false';
    const tree = parser.parse(sourceCode);
    console.log(JSON.stringify(tree));
    console.log(tree);
    //console.dir(TreeSitterNix.parse('true'))
    */

    console.log('MonacoEditor: Initialize Monaco')

    if (model() === null) {
      console.log('MonacoEditor: Initialize Monaco: model == null')
      const modelListener = Monaco.editor.onDidCreateModel((model) => {
        console.log(`model.uri.toString() = ${model.uri.toString()}`)
        if (model.uri.toString() === finalProps.url) {
          console.log('MonacoEditor: Initialize Monaco 2')
          setupEditor();
          updateModel();
          modelListener.dispose();
        }
        else {
          console.log('MonacoEditor: Initialize Monaco 2 not')
        }
      });
    } else {
      console.log('MonacoEditor: Initialize Monaco: model != null')
      setupEditor();
    }

    console.log('MonacoEditor: Add LezerParser to Monaco')

    //editor.deltaDecorations(); // FIXME

    /* this is working
    const monacoTreeSitter = new MonacoTreeSitter.MonacoTreeSitter(Monaco, editor, language, {
      onUpdateTree: newTree => {
        //console.log('onUpdateTree: newTree', newTree)
        console.log('onUpdateTree: newTree.rootNode', newTree.rootNode)
        setState('tree', newTree);

        if (props.setTree) props.setTree(newTree);
      },
    });
    */

    const monacoLezerParserInstance = new MonacoLezerParser.MonacoLezerParser(Monaco, editor, language, {
      onUpdateTree: newTree => {
        //console.log('onUpdateTree: newTree', newTree)
        //console.log('onUpdateTree: newTree.rootNode', newTree.rootNode) // tree-sitter
        //console.log('MonacoEditor: onUpdateTree: newTree', newTree)
        //console.log('MonacoEditor: onUpdateTree: newSource', editor.getValue());
        setState('tree', newTree);
        // note: first set source, then set tree. App.jsx reacts to new tree, but also needs new source
        if (props.setSource) props.setSource(editor.getValue()); // TODO incremental sync
        if (props.setTree) props.setTree(newTree); // callback to parent components
      },
    });

  });

  onCleanup(() => editor?.dispose());

  const updateModel = () => {
    if (model() !== undefined && editor !== undefined) {
      console.log('MonacoEditor: updateModel')
      editor.setModel(model());
      //liftOff(editor); // FIXME
      // liftOff is defined in
      // solidjs-monaco-editor-component/editor/setupSolid.ts
    }
  };
  createEffect(updateModel);

  /*
  createEffect(() => {
    Monaco.editor.setTheme(finalProps.isDark ? 'vs-dark-plus' : 'vs-light-plus');
  });
  */

/*
  createEffect(() => {
    //const fontSize = zoomState.fontSize;

    if (!editor) return;

    //editor.updateOptions({ fontSize });
  });
*/

  const showActionBar = () => {
    const hasActions = finalProps.canFormat || props.canCopy;
    return finalProps.showActionBar && hasActions;
  };

  /*
        style="grid-template-rows: minmax(0, 1fr) auto"
*/
  return (




    <div style="height:100%">
      <div
        class={`grid grid-cols-1 ${finalProps.class || ''}`}
        classList={{ ...(finalProps.classList || {}), relative: props.canCopy }}
        style="height:100%"
      >
        <div class="p-0 dark:text-white" style="height:100%" ref={parent}></div>

        <div class="flex justify-end space-x-2 p-2" classList={{ hidden: !showActionBar() }}>
          <Show when={finalProps.canFormat}>
            <button
              type="button"
              onClick={formatCode}
              class="inline-flex items-center p-1 rounded-lg text-sm uppercase leading-none focus:outline-none focus:ring-1"
              title="Format the source code"
              classList={{
                'text-blueGray-400': !format(),
                'text-green-900': format(),
              }}
            >
              <span class="sr-only">{format() ? 'Code formatted!' : 'Format code'}</span>
              <Icon path={format() ? checkCircle : code} class="h-6" />
            </button>
          </Show>

          <Show when={finalProps.canCopy}>
            <button
              type="button"
              onClick={copyToClipboard}
              class="inline-flex items-center p-1 rounded-lg text-sm uppercase leading-none focus:outline-none focus:ring-1"
              title="Copy the source code"
              classList={{
                'text-blueGray-400': !clip(),
                'text-green-900': clip(),
              }}
            >
              <span class="sr-only">{clip() ? 'Copied!' : 'Copy'}</span>
              <Icon path={clip() ? clipboardCheck : clipboard} class="h-6" />
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}

/*
      <pre>
        TreeView JSON:
        {JSON.stringify(state.tree && state.tree.rootNode.children, null, 2)}
        :TreeViewJSON
      </pre>

*/

function TreeView(props) {
  return (
      <Show
        when={props.node.children.length > 0}
        fallback={
          <div class="leaf-node" style="font-family: monospace">
            <Show
              when={props.node.type != props.node.text}
              fallback={<><Indent depth={props.depth}/> {props.node.type}</>}
            ><Indent depth={props.depth}/> {props.node.text} <span class="comment"># {props.node.type}</span></Show>
          </div>
        }
      >
        <div class="branch-node" style="font-family: monospace">
          <Indent depth={props.depth}/> {props.node.type}
          <div>
            <For each={props.node.children}>{childNode => TreeView({ node: childNode, depth: props.depth + 1 })}</For>
          </div>
        </div>
    </Show>
  );
}

function Indent(props) {
  return <For each={Array.from({ length: 2*props.depth })}>{() => <span>&nbsp;</span>}</For>
}

/*
*/