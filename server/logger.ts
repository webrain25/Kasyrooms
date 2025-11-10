import { randomUUID } from 'crypto';

type LogLevel = 'debug'|'info'|'warn'|'error';

function serializeError(err: any) {
  if (!err) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  try { return JSON.parse(JSON.stringify(err)); } catch { return { value: String(err) }; }
}

function log(level: LogLevel, msg: string, meta?: any) {
  const entry: any = {
    level,
    time: new Date().toISOString(),
    msg,
    ...meta,
  };
  if (meta?.err) entry.err = serializeError(meta.err);
  // Single-line JSON for log aggregation
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, meta?: any) => log('debug', msg, meta),
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, meta?: any) => log('error', msg, meta),
  child: (ctx: Record<string, any>) => ({
    debug: (msg: string, meta?: any) => log('debug', msg, { ...ctx, ...meta }),
    info: (msg: string, meta?: any) => log('info', msg, { ...ctx, ...meta }),
    warn: (msg: string, meta?: any) => log('warn', msg, { ...ctx, ...meta }),
    error: (msg: string, meta?: any) => log('error', msg, { ...ctx, ...meta }),
  })
};

export function genRequestId() { return randomUUID(); }
