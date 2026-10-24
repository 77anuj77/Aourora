export interface ColumnInfo { name: string; type: string; notnull: boolean; pk: boolean; default: any; }
export interface TableSchema { table: string; columns: ColumnInfo[]; foreign_keys: { column: string; ref_table: string; ref_column: string }[]; indexes: { name: string; unique: boolean }[]; }
export interface SqlExecuteRequest {
  database: string; table: string; operation: string;
  values?: Record<string, any>; columns?: string[]; conditions?: { column: string; operator: string; value: any }[];
  order_by?: string; order_dir?: string; limit?: number; join_table?: string; join_type?: string; join_on?: string;
  aggregate_func?: string; aggregate_column?: string; group_by?: string; record_id?: number; set_values?: Record<string, any>; where_id_column?: string;
}
export interface MongoExecuteRequest { collection: string; operation: string; document?: any; filter?: any; update?: any; pipeline?: any[]; limit?: number; }
export interface QueryResult {
  success: boolean; database: string; operation: string; preview: string; parameters?: any; affected_rows?: number | null; duration_ms: number; rows?: any[] | null; error?: string; history_id?: number;
}
export interface HistoryItem { history_id: number; database_name: string; operation: string; preview?: string; parameters?: string; status: string; affected_rows?: number; duration_ms?: number; created_at: string; }
