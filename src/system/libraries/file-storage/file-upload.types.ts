export type FileUpload =
  | Express.Multer.File
  | Express.Multer.File[]
  | string
  | string[]
  | null;
