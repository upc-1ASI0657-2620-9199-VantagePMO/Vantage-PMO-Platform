/** Entity inside the Document aggregate: one uploaded revision of the document (US35). */
export interface DocumentVersion {
  number: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksum: string;
  storageKey: string;
  uploadedBy: string;
  uploadedAt: Date;
}
