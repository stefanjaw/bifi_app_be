import { PaginateModel } from "mongoose";

export interface refModelMap<T> {
  path: string;
  getModel: () => PaginateModel<any>;
  isArray: boolean;
}
