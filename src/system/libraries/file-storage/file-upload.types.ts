/**
 * Union type representing a file upload from multer (Express.Multer.File)
 * or an already-processed InnerFile (e.g. after GridFS upload), or null.
 */
export type FileUpload =
  | Express.Multer.File
  | Express.Multer.File[]
  | InnerFile
  | InnerFile[]
  | null;

/** Represents a file already persisted in GridFS with its metadata. */
export type InnerFile = {
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  fileMetadata?: object;
};
