import { Type } from "./type.type";

export interface MappedType<T> extends Type<T> {
  new (): T;
}
