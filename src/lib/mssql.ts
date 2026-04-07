import sql from "mssql";

export interface MssqlConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypt: boolean;
  trustCert: boolean;
}

// Singleton pool — reused across requests (like Prisma pattern)
const globalForMssql = globalThis as unknown as {
  mssqlPool: sql.ConnectionPool | undefined;
  mssqlPoolKey: string | undefined;
};

function configKey(cfg: MssqlConfig) {
  return `${cfg.host}:${cfg.port}/${cfg.database}/${cfg.username}`;
}

/** Creates a one-off connection — use only for testing credentials, not for repeated queries. */
export async function createMssqlPool(cfg: MssqlConfig): Promise<sql.ConnectionPool> {
  return sql.connect({
    user: cfg.username,
    password: cfg.password,
    server: cfg.host,
    database: cfg.database,
    port: cfg.port,
    options: {
      encrypt: cfg.encrypt,
      trustServerCertificate: cfg.trustCert,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
  });
}

export async function getPool(cfg: MssqlConfig): Promise<sql.ConnectionPool> {
  const key = configKey(cfg);

  // Reuse pool if config hasn't changed and pool is still connected
  if (
    globalForMssql.mssqlPool &&
    globalForMssql.mssqlPoolKey === key &&
    globalForMssql.mssqlPool.connected
  ) {
    return globalForMssql.mssqlPool;
  }

  // Close old pool if config changed
  if (globalForMssql.mssqlPool && globalForMssql.mssqlPool.connected) {
    try { await globalForMssql.mssqlPool.close(); } catch { /* ignore */ }
  }

  const pool = await sql.connect({
    user: cfg.username,
    password: cfg.password,
    server: cfg.host,
    database: cfg.database,
    port: cfg.port,
    options: {
      encrypt: cfg.encrypt,
      trustServerCertificate: cfg.trustCert,
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 60000,
    },
  });

  globalForMssql.mssqlPool = pool;
  globalForMssql.mssqlPoolKey = key;
  return pool;
}

/** Call this when connection settings are saved to force pool recreation. */
export async function invalidatePool() {
  if (globalForMssql.mssqlPool) {
    try { await globalForMssql.mssqlPool.close(); } catch { /* ignore */ }
    globalForMssql.mssqlPool = undefined;
    globalForMssql.mssqlPoolKey = undefined;
  }
}

export async function listTables(cfg: MssqlConfig): Promise<string[]> {
  const pool = await getPool(cfg);
  const result = await pool
    .request()
    .query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"
    );
  return result.recordset.map((r: { TABLE_NAME: string }) => r.TABLE_NAME);
}

export async function listColumns(
  cfg: MssqlConfig,
  tableName: string
): Promise<string[]> {
  const pool = await getPool(cfg);
  const result = await pool
    .request()
    .input("table", sql.NVarChar, tableName)
    .query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=@table ORDER BY ORDINAL_POSITION"
    );
  return result.recordset.map((r: { COLUMN_NAME: string }) => r.COLUMN_NAME);
}

export async function searchTable(
  cfg: MssqlConfig,
  tableName: string,
  searchColumn: string,
  query: string,
  limit = 20
): Promise<Record<string, unknown>[]> {
  const pool = await getPool(cfg);
  // Allow spaces and dots (schema.table) — brackets in the query prevent injection
  const safeTable = tableName.replace(/[^a-zA-Z0-9_\s.]/g, "");
  const safeCol = searchColumn.replace(/[^a-zA-Z0-9_\s]/g, "");
  const result = await pool
    .request()
    .input("q", sql.NVarChar, `%${query}%`)
    .input("lim", sql.Int, limit)
    .query(
      `SELECT TOP (@lim) * FROM [${safeTable}] WHERE CAST([${safeCol}] AS NVARCHAR(MAX)) LIKE @q ORDER BY [${safeCol}]`
    );
  return result.recordset as Record<string, unknown>[];
}

export async function getRowByValue(
  cfg: MssqlConfig,
  tableName: string,
  searchColumn: string,
  value: string
): Promise<Record<string, unknown> | null> {
  const pool = await getPool(cfg);
  const safeTable = tableName.replace(/[^a-zA-Z0-9_\s.]/g, "");
  const safeCol = searchColumn.replace(/[^a-zA-Z0-9_\s]/g, "");
  const result = await pool
    .request()
    .input("v", sql.NVarChar, value)
    .query(
      `SELECT TOP 1 * FROM [${safeTable}] WHERE CAST([${safeCol}] AS NVARCHAR(MAX)) = @v`
    );
  return (result.recordset[0] as Record<string, unknown>) ?? null;
}
