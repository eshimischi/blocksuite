import type {
  Constructor,
  IVec,
  SerializedXYWH,
} from '@blocksuite/global/utils';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  Bound,
  PointLocation,
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '@blocksuite/global/utils';
import { BlockModel } from '@blocksuite/store';

import type { EditorHost } from '../view/index.js';
import type { GfxPrimitiveElementModel } from './surface/element-model.js';

import { SurfaceBlockModel } from './surface/model.js';

export interface ElementHitTestOptions {
  expand?: number;

  /**
   * If true, the transparent area of the element will be ignored during hit test.
   * Otherwise, the transparent area will be considered as filled area.
   *
   * Default is true.
   */
  ignoreTransparent?: boolean;

  all?: boolean;
  zoom?: number;
}

export interface CommonElement {
  id: string;
  xywh: SerializedXYWH;
  /**
   * In some cases, you need to draw something related to the element, but it does not belong to the element itself.
   * And it is also interactive, you can select element by clicking on it. E.g. the title of the group element.
   * In this case, we need to store this kind of external xywh in order to do hit test. This property should not be synced to the doc.
   * This property should be updated every time it gets rendered.
   */
  externalXYWH: SerializedXYWH | undefined;
  externalBound: Bound | null;
  rotate: number;
  connectable: boolean;
  index: string;

  /**
   * The bound of the element after rotation.
   * The bound without rotation should be created by `Bound.deserialize(this.xywh)`.
   */
  elementBound: Bound;
  containedByBounds(bounds: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  hitTest(
    x: number,
    y: number,
    options: ElementHitTestOptions,
    host: EditorHost
  ): boolean;
  boxSelect(bound: Bound): boolean;
}

export class GfxBlockElementModel<
  Props extends GfxSelectableProps = GfxSelectableProps,
> extends BlockModel<Props> {
  private _externalXYWH: SerializedXYWH | undefined = undefined;

  connectable = true;

  rotate = 0;

  boxSelect(bound: Bound): boolean {
    return (
      this.containedByBounds(bound) ||
      bound.points.some((point, i, points) =>
        this.intersectWithLine(point, points[(i + 1) % points.length])
      )
    );
  }

  containedByBounds(bounds: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    const points = getPointsFromBoundsWithRotation({
      x: bound.x,
      y: bound.y,
      w: bound.w,
      h: bound.h,
      rotate: this.rotate,
    });
    return points.some(point => bounds.containsPoint(point));
  }

  getNearestPoint(point: IVec): IVec {
    const bound = Bound.deserialize(this.xywh);
    return polygonNearestPoint(
      rotatePoints(bound.points, bound.center, this.rotate ?? 0),
      point
    );
  }

  getRelativePointLocation(relativePoint: IVec): PointLocation {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      this.rotate ?? 0
    )[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate ?? 0);
    const tangent = polygonGetPointTangent(points, rotatePoint);

    return new PointLocation(rotatePoint, tangent);
  }

  hitTest(
    x: number,
    y: number,
    _: ElementHitTestOptions,
    __: EditorHost
  ): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }

  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);

    return linePolygonIntersects(
      start,
      end,
      rotatePoints(bound.points, bound.center, this.rotate ?? 0)
    );
  }

  get elementBound() {
    const bound = Bound.deserialize(this.xywh);
    return Bound.from(getBoundsWithRotation({ ...bound, rotate: this.rotate }));
  }

  get externalBound(): Bound | null {
    return this._externalXYWH ? Bound.deserialize(this._externalXYWH) : null;
  }

  get externalXYWH(): SerializedXYWH | undefined {
    return this._externalXYWH;
  }

  set externalXYWH(xywh: SerializedXYWH | undefined) {
    this._externalXYWH = xywh;
  }

  get group(): CommonElement | null {
    const surface = this.doc
      .getBlocks()
      .find(block => block instanceof SurfaceBlockModel);

    if (!surface) return null;

    return (surface as SurfaceBlockModel).getGroup(this.id) ?? null;
  }

  get groups(): CommonElement[] {
    const surface = this.doc
      .getBlocks()
      .find(block => block instanceof SurfaceBlockModel);

    if (!surface) return [];

    return (surface as SurfaceBlockModel).getGroups(this.id);
  }
}

export type GfxSelectableProps = {
  xywh: SerializedXYWH;
  index: string;
};

export function selectable<
  Props extends GfxSelectableProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  if (SuperClass === BlockModel) {
    return GfxBlockElementModel as unknown as typeof GfxBlockElementModel<Props>;
  } else {
    let currentClass = SuperClass;

    while (
      Object.getPrototypeOf(currentClass.prototype) !== BlockModel.prototype &&
      Object.getPrototypeOf(currentClass.prototype) !== null
    ) {
      currentClass = Object.getPrototypeOf(currentClass.prototype).constructor;
    }

    if (Object.getPrototypeOf(currentClass.prototype) === null) {
      throw new BlockSuiteError(
        ErrorCode.GfxBlockElementError,
        'The SuperClass is not a subclass of BlockModel'
      );
    }

    Object.setPrototypeOf(
      currentClass.prototype,
      GfxBlockElementModel.prototype
    );
  }

  return SuperClass as unknown as typeof GfxBlockElementModel<Props>;
}

export type GfxModel = GfxBlockElementModel | GfxPrimitiveElementModel;
