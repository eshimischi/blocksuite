import type { SerializedXYWH } from '@blocksuite/global/utils';
import type { Text } from '@blocksuite/store';

import { Bound } from '@blocksuite/global/utils';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { CustomColor } from '../surface-block/consts.js';
import type { ElementHitTestOptions } from '../surface-block/element-model/base.js';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';

type FrameBlockProps = {
  title: Text;
  background: string | CustomColor;
  xywh: SerializedXYWH;
  index: string;
};

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: (internal): FrameBlockProps => ({
    title: internal.Text(),
    background: '--affine-palette-transparent',
    xywh: `[0,0,100,100]`,
    index: 'a0',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:surface'],
    children: [],
  },
  toModel: () => {
    return new FrameBlockModel();
  },
});

export class FrameBlockModel extends selectable<FrameBlockProps>(BlockModel) {
  static PADDING = [8, 10];

  override boxSelect(selectedBound: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    return (
      bound.isIntersectWithBound(selectedBound) || selectedBound.contains(bound)
    );
  }

  override hitTest(x: number, y: number, _: ElementHitTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);
    const hit = bound.isPointNearBound([x, y], 5);

    if (hit) return true;

    return this.externalBound?.isPointInBound([x, y]) ?? false;
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:frame': FrameBlockModel;
    }
  }
}
