# BlockSuite Components Overview

BlockSuite implements the editor features for the [AFFiNE](https://affine.pro/) knowledge base. The relationship between them is similar to that between the [Monaco Editor](https://github.com/microsoft/monaco-editor) and [VSCode](https://code.visualstudio.com/), but with one major difference: BlockSuite is not automatically generated based on the AFFiNE codebase, but is maintained independently with a different tech stack — AFFiNE uses React while BlockSuite uses [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).

This difference has led BlockSuite to set clear boundaries based on a **component-centric** philosophy, ensuring:

- Both AFFiNE and other projects should equally reuse and extend BlockSuite through components, without any privileges.
- BlockSuite components can be easily reused regardless of whether you are using React or other frameworks.
- How you extend BlockSuite is precisely how you extend AFFiNE.

## Component Basics

In a nutshell, BlockSuite categorizes components into the following types:

- **Editor** - A container used to present document content in various forms. Different editors are composed of different sets of [block specs](../guide/block-spec).
- **Block** - The atomic unit for constructing document within the editor. Once a block spec is registered, multiple corresponding block instances can be rendered in the editor.
- **Widget** - Auxiliary components that contextually show up in the editor on demand, such as a search bar or color picker. Every block can define its own widgets.
- **Fragment** - Independent components outside the editor. They share the document with the editor but have their own lifecycles.

![showcase-fragments-2](../images/showcase-fragments-2.jpg)

These BlockSuite components are all implemented based on web components. For a more detailed description of the relationships between these components, please refer to the [component types](../guide/component-types) document.

## Extension and Customization

Based on the components API, BlockSuite allows:

- [Defining custom blocks](../guide/working-with-block-tree#defining-new-blocks) compatible with multiple editors.
- Configuring, extending, and replacing widgets within the editor, such as various toolbars, popups, and menus.
- Reusing components outside of the editor, such as panels for comments, outlines, or even AI copilots.

All BlockSuite components only need to be attached to the BlockSuite document model for use. For information on how to interact with this block tree, please refer to the [usage guide](../guide/working-with-block-tree) for the BlockSuite framework.

## AFFiNE Integration

Regarding how BlockSuite components can be used in AFFiNE (or any other product of yours), here are some quick takeaways:

- The BlockSuite editor consists of various block specs, each of which can optionally include some widgets. Therefore, **when you are reusing an existing first-party BlockSuite editor, you are actually reusing a preset of blocks and widgets**. Default editors are fine-tuned presets for AFFiNE, but you are free to compose you own presets.
- Currently, all BlockSuite components are native web components, but we plan to provide official support for multiple frameworks.
- AFFiNE does not use a special version of BlockSuite, [we eat our own dogfood](https://gist.github.com/chitchcock/1281611).