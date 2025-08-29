export type FileUpload =
  | Express.Multer.File
  | Express.Multer.File[]
  | InnerFile
  | InnerFile[]
  | null;

export type InnerFile = {
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  fileMetadata?: object;
};
