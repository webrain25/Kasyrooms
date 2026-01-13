// Sirplay config constants

export const SIRPLAY_VERIFY_MODE: 'strict' | 'relaxed' =
  process.env.SIRPLAY_VERIFY_MODE === 'strict' ? 'strict' : 'relaxed';

export const IS_DEV_ENV: boolean = process.env.APP_ENV === 'dev';
