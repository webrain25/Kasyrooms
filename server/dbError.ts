export type DbErrorMeta = {
  message: string;
  code?: string;
  detail?: string;
  where?: string;
  schema?: string;
  table?: string;
  constraint?: string;
  routine?: string;
  severity?: string;
  stack?: string;
};

// Extract useful Postgres/Neon error fields without logging queries/parameters.
export function toDbErrorMeta(err: unknown): DbErrorMeta {
  if (err && typeof err === "object") {
    const e = err as any;
    return {
      message: typeof e.message === "string" ? e.message : String(err),
      code: typeof e.code === "string" ? e.code : undefined,
      detail: typeof e.detail === "string" ? e.detail : undefined,
      where: typeof e.where === "string" ? e.where : undefined,
      schema: typeof e.schema === "string" ? e.schema : undefined,
      table: typeof e.table === "string" ? e.table : undefined,
      constraint: typeof e.constraint === "string" ? e.constraint : undefined,
      routine: typeof e.routine === "string" ? e.routine : undefined,
      severity: typeof e.severity === "string" ? e.severity : undefined,
      stack: typeof e.stack === "string" ? e.stack : undefined,
    };
  }

  return { message: String(err) };
}
