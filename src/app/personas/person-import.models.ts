export type PersonImportBatchStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'READY'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface PersonImportBatch {
  uuid: string;
  original_filename: string;
  status: PersonImportBatchStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  processed_rows: number;
  failed_rows: number;
  confirmed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface PersonImportUploadResponse {
  data: PersonImportBatch;
}
