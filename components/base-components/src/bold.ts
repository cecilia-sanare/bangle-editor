import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import {
  Command,
  DOMOutputSpec,
  EditorState,
  keymap,
  Schema,
  toggleMark,
} from '@bangle.dev/pm';
import {
  assertNotUndefined,
  createObject,
  isMarkActiveInSelection,
  markInputRule,
  markPasteRule,
} from '@bangle.dev/utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBold,
  queryIsBoldActive,
};
export const defaultKeys = {
  toggleBold: 'Mod-b',
};

const name = 'bold';

const getTypeFromSchema = (schema: Schema) => {
  const markType = schema.marks[name];
  assertNotUndefined(markType, `markType ${name} not found`);
  return markType;
};
function specFactory(): RawSpecs {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'strong',
        },
        {
          tag: 'b',
          // making node any type as there is some problem with pm-model types
          getAttrs: (node: any) => node.style.fontWeight !== 'normal' && null,
        },
        {
          style: 'font-weight',
          getAttrs: (value: any) =>
            /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ],
      toDOM: (): DOMOutputSpec => ['strong', 0],
    },
    markdown: {
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        strong: { mark: name },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markdownShortcut &&
        markPasteRule(/(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g, type),
      markdownShortcut &&
        markPasteRule(/(?:^|\s)((?:__)((?:[^__]+))(?:__))/g, type),
      markdownShortcut &&
        markInputRule(/(?:^|\s)((?:__)((?:[^__]+))(?:__))$/, type),
      markdownShortcut &&
        markInputRule(/(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/, type),
      keybindings &&
        keymap(createObject([[keybindings.toggleBold, toggleBold()]])),
    ];
  };
}

export function toggleBold(): Command {
  return (state, dispatch, _view) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return toggleMark(markType)(state, dispatch);
  };
}

export function queryIsBoldActive() {
  return (state: EditorState) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);
    return isMarkActiveInSelection(markType)(state);
  };
}
