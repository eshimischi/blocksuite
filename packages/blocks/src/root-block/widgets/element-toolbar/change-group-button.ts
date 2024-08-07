import { WithDisposable } from '@blocksuite/block-std';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/global/utils';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import type { GroupElementModel } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import { toast } from '../../../_common/components/toast.js';
import '../../../_common/components/toolbar/icon-button.js';
import '../../../_common/components/toolbar/separator.js';
import { renderToolbarSeparator } from '../../../_common/components/toolbar/separator.js';
import {
  NoteIcon,
  RenameIcon,
  UngroupButtonIcon,
} from '../../../_common/icons/index.js';
import { NoteDisplayMode } from '../../../_common/types.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { DEFAULT_NOTE_HEIGHT } from '../../edgeless/utils/consts.js';
import { mountGroupTitleEditor } from '../../edgeless/utils/text.js';

@customElement('edgeless-change-group-button')
export class EdgelessChangeGroupButton extends WithDisposable(LitElement) {
  private _insertIntoPage() {
    if (!this.edgeless.doc.root) return;

    const rootModel = this.edgeless.doc.root;
    const notes = rootModel.children.filter(
      model =>
        matchFlavours(model, ['affine:note']) &&
        model.displayMode !== NoteDisplayMode.EdgelessOnly
    );
    const lastNote = notes[notes.length - 1];
    const referenceGroup = this.groups[0];

    let targetParent = lastNote?.id;

    if (!lastNote) {
      const targetXYWH = deserializeXYWH(referenceGroup.xywh);

      targetXYWH[1] = targetXYWH[1] + targetXYWH[3];
      targetXYWH[3] = DEFAULT_NOTE_HEIGHT;

      const newAddedNote = this.edgeless.doc.addBlock(
        'affine:note',
        {
          xywh: serializeXYWH(...targetXYWH),
        },
        rootModel.id
      );

      targetParent = newAddedNote;
    }

    this.edgeless.doc.addBlock(
      'affine:surface-ref',
      {
        reference: this.groups[0].id,
        refFlavour: 'group',
      },
      targetParent
    );

    toast(this.edgeless.host, 'Group has been inserted into page');
  }

  protected override createRenderRoot() {
    return this;
  }

  protected override render() {
    const { groups } = this;
    const onlyOne = groups.length === 1;

    return join(
      [
        onlyOne
          ? html`
              <edgeless-icon-button
                aria-label="Insert into Page"
                .tooltip=${'Insert into Page'}
                .iconSize=${'20px'}
                .labelHeight=${'20px'}
                @click=${this._insertIntoPage}
              >
                ${NoteIcon}
                <span class="label">Insert into Page</span>
              </edgeless-icon-button>
            `
          : nothing,

        onlyOne
          ? html`
              <edgeless-icon-button
                class=${'edgeless-component-toolbar-group-rename-button'}
                aria-label="Rename"
                .tooltip=${'Rename'}
                .iconSize=${'20px'}
                @click=${() => mountGroupTitleEditor(groups[0], this.edgeless)}
              >
                ${RenameIcon}
              </edgeless-icon-button>
            `
          : nothing,

        html`
          <edgeless-icon-button
            class=${'edgeless-component-toolbar-ungroup-button'}
            aria-label="Ungroup"
            .tooltip=${'Ungroup'}
            .iconSize=${'20px'}
            @click=${() =>
              groups.forEach(group => this.edgeless.service.ungroup(group))}
          >
            ${UngroupButtonIcon}
          </edgeless-icon-button>
        `,
      ].filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor groups!: GroupElementModel[];
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-group-button': EdgelessChangeGroupButton;
  }
}

export function renderGroupButton(
  edgeless: EdgelessRootBlockComponent,
  groups?: GroupElementModel[]
) {
  if (!groups?.length) return nothing;

  return html`
    <edgeless-change-group-button .edgeless=${edgeless} .groups=${groups}>
    </edgeless-change-group-button>
  `;
}
