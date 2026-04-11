// data-mode.ts — Helper for dual ORM/NET mode
// Author: Dr Hamid MADANI drmdh@msn.com

/** Returns 'orm' or 'net' based on MOSTA_DATA env variable. Default: 'orm' */
export function getDataMode(): 'orm' | 'net' {
  return (process.env.MOSTA_DATA === 'net') ? 'net' : 'orm';
}

/** Returns true if running in NET mode (data accessed via remote NET server) */
export function isNetMode(): boolean {
  return process.env.MOSTA_DATA === 'net';
}
