import { setBlockType } from 'tiptap-commands';
import { findParentNodeOfType } from 'prosemirror-utils';
import { Node } from './node';
import { moveNode } from './list-item/commands';
import { filter } from '../utils/pm-utils';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
} from '../core-commands';
import { TextSelection } from 'prosemirror-state';

export class Paragraph extends Node {
  get name() {
    return 'paragraph';
  }

  get schema() {
    return {
      content: 'inline*',
      group: 'block',
      draggable: false,
      parseDOM: [
        {
          tag: 'p',
        },
      ],
      toDOM: () => ['p', 0],
    };
  }

  commands({ type }) {
    return () => setBlockType(type);
  }

  keys({ type, schema }) {
    // Enables certain command to only work if paragraph is direct child of `doc` node
    const parentCheck = parentHasDirectParentOfType(type, schema.nodes.doc);

    return {
      'Alt-ArrowUp': filter(parentCheck, moveNode(type, 'UP')),
      'Alt-ArrowDown': filter(parentCheck, moveNode(type, 'DOWN')),
      'Ctrl-a': filter(
        [(state) => state.selection.empty],
        (state, dispatch) => {
          const current = findParentNodeOfType(type)(state.selection);

          if (!current) {
            return false;
          }

          const { node, start } = current;

          dispatch(
            state.tr.setSelection(TextSelection.create(state.doc, start)),
          );
          return true;
        },
      ),
      'Ctrl-e': filter(
        [(state) => state.selection.empty],
        (state, dispatch) => {
          const current = findParentNodeOfType(type)(state.selection);

          if (!current) {
            return false;
          }

          const { node, start } = current;

          dispatch(
            state.tr.setSelection(
              TextSelection.create(state.doc, start + node.content.size),
            ),
          );
          return true;
        },
      ),
      'Cmd-c': filter(
        // So that we donot interfere with nested p's in other nodes
        parentCheck,
        copyEmptyCommand(type),
      ),
      'Cmd-x': filter(
        // So that we donot interfere with nested p's in other nodes
        parentCheck,
        cutEmptyCommand(type),
      ),
    };
  }
}
