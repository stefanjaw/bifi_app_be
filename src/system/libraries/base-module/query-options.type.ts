export interface paginationOptions {
  paginate: boolean;
  limit: number;
  page: number;
}

export interface orderByOptions {
  field: string;
  order: "asc" | "desc";
}
