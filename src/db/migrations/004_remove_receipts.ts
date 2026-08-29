import { deleteLegacyReceiptFiles } from '../../utils/legacyReceiptCleanup';
import type { Migration } from './types';

const sql = `
PRAGMA foreign_keys = ON;
DROP INDEX IF EXISTS idx_receipts_status;
DROP TABLE IF EXISTS receipt_inbox;
DELETE FROM settings WHERE key = 'quick_capture_ocr_enabled';
`;

export const migration004: Migration = {
  version: 4,
  prepare: deleteLegacyReceiptFiles,
  sql,
};
