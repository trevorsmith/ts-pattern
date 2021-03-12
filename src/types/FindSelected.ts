import { PatternType } from '../PatternType';
import type {
  Cast,
  Compute,
  IsPlainObject,
  UnionToTuple,
  ValueOf,
} from './helpers';
import type { NamedSelectPattern, AnonymousSelectPattern } from './Pattern';

export type FindSelectionUnion<
  i,
  p,
  // path just serves as an id, to identify different anonymous patterns which have the same type
  path extends any[] = []
> = p extends NamedSelectPattern<infer k>
  ? [k, i, path]
  : p extends AnonymousSelectPattern
  ? [PatternType.AnonymousSelect, i, path]
  : p extends readonly (infer pp)[]
  ? i extends readonly (infer ii)[]
    ? [i, p] extends [
        readonly [infer i1, infer i2, infer i3, infer i4, infer i5],
        readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
      ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
          | FindSelectionUnion<i3, p3, [...path, 3]>
          | FindSelectionUnion<i4, p4, [...path, 4]>
          | FindSelectionUnion<i5, p5, [...path, 5]>
      : [i, p] extends [
          readonly [infer i1, infer i2, infer i3, infer i4],
          readonly [infer p1, infer p2, infer p3, infer p4]
        ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
          | FindSelectionUnion<i3, p3, [...path, 3]>
          | FindSelectionUnion<i4, p4, [...path, 4]>
      : [i, p] extends [
          readonly [infer i1, infer i2, infer i3],
          readonly [infer p1, infer p2, infer p3]
        ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
          | FindSelectionUnion<i3, p3, [...path, 3]>
      : [i, p] extends [
          readonly [infer i1, infer i2],
          readonly [infer p1, infer p2]
        ]
      ?
          | FindSelectionUnion<i1, p1, [...path, 1]>
          | FindSelectionUnion<i2, p2, [...path, 2]>
      : FindSelectionUnion<
          ii,
          pp,
          [...path, number]
        > extends infer selectionUnion
      ? selectionUnion extends [infer k, infer v, infer path]
        ? [k, v[], path]
        : never
      : never
    : never
  : IsPlainObject<p> extends true
  ? i extends object
    ? ValueOf<
        {
          [k in keyof i & keyof p]: FindSelectionUnion<
            i[k],
            p[k],
            [...path, k]
          >;
        }
      >
    : never
  : never;

export type SeveralAnonymousSelectError<
  a = 'You can only use a single anonymous selection (with `select()`) in your pattern. If you need to select multiple values, give them names with `select(<name>)` instead'
> = {
  __error: never;
} & a;

export type MixedNamedAndUnnamedSelectError<
  a = 'Mixing named selection (`select("name")`) and anonymous selection (`select()`) is forbiden. Please you only named selections'
> = {
  __error: never;
} & a;

type OrderSelections<
  selections,
  output extends { positional: any; kwargs: {} } = {
    positional: '@ts-pattern/empty';
    kwargs: {};
  }
> = selections extends [infer head, ...infer tail]
  ? head extends [infer key, infer value, any]
    ? key extends PatternType.AnonymousSelect
      ? OrderSelections<
          tail,
          {
            positional: output['positional'] extends '@ts-pattern/empty'
              ? value
              : '@ts-pattern/error';
            kwargs: output['kwargs'];
          }
        >
      : OrderSelections<
          tail,
          {
            positional: output['positional'];
            kwargs: output['kwargs'] & { [k in Cast<key, string>]: value };
          }
        >
    : never
  : output;

// SelectionTuplesToArgs :: [number | string, value][] -> [...args]
type SelectionTuplesToArgs<
  selections,
  i
> = OrderSelections<selections> extends {
  positional: infer positional;
  kwargs: infer kwargs;
}
  ? positional extends '@ts-pattern/error'
    ? SeveralAnonymousSelectError
    : positional extends '@ts-pattern/empty'
    ? [keyof kwargs] extends [never]
      ? i
      : Compute<kwargs>
    : [keyof kwargs] extends [never]
    ? positional
    : MixedNamedAndUnnamedSelectError
  : i;

export type FindSelected<i, p> = SelectionTuplesToArgs<
  UnionToTuple<FindSelectionUnion<i, p>>,
  i
>;
