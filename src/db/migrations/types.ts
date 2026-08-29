export interface Migration {
  version: number;
  sql: string;
  prepare?: () => Promise<void>;
}
