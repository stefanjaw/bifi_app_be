export interface paginationOptions {
  paginate: boolean;
  limit: number;
  page: number;
}

export interface orderByField {
  field: string;
  order: "asc" | "desc";
}

export interface orderByQuery {
  orderBy: orderByField[];
}
