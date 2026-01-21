import { FileInfo } from "basic-ftp";

export interface ftpResponse {
  buffer: Buffer<ArrayBufferLike>;
  metadata: FileInfo;
}
