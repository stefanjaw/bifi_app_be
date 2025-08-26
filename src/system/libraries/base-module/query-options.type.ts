export type paginationOptions =
  | { paginate: true; page: number; limit: number }
  | { paginate: false };

export interface orderByField {
  field: string;
  order: "asc" | "desc";
}

export interface orderByQuery {
  orderBy: orderByField[];
}
