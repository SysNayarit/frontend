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

export type PersonImportRowStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID'
  | 'PROCESSED'
  | 'FAILED'
  | 'SKIPPED';

export type PersonImportRowData = Record<string, unknown>;

export interface PersonImportRow {
  row_number: number;
  status: PersonImportRowStatus;
  raw_data: PersonImportRowData;
  normalized_data: PersonImportRowData | null;
  validation_errors: Record<string, string[]>;
  result_data: PersonImportRowData | null;
}

export interface PersonImportPreviewMeta {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

export interface PersonImportPreviewResponse {
  data: PersonImportBatch;
  rows: PersonImportRow[];
  meta: PersonImportPreviewMeta;
}
export interface PersonImportHistoryItem extends PersonImportBatch {
  created_at: string;
}

export interface PersonImportHistoryResponse {
  data: PersonImportHistoryItem[];
  meta: PersonImportPreviewMeta;
}