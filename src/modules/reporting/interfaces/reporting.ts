export type IReportingPaths = {
  label: string;
  path:
    | `${string}`
    | `${string}.${string}`
    | `${string}[]`
    | `${string}[${number}]`
    | `${string}[${number}].${string}`
    | `${string}[].${string}`;
}[];

export type IReportingMap = Record<string, IReportingPaths>;
