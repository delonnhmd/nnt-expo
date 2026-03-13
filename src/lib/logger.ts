export const DEBUG = process.env.EXPO_PUBLIC_DEBUG === '1';
export const log = (tag: string, ...a: any[]) => { if (DEBUG) console.log(`[${tag}]`, ...a); };
export const warn = (tag: string, ...a: any[]) => console.warn(`[${tag}]`, ...a);
export const error = (tag: string, ...a: any[]) => console.error(`[${tag}]`, ...a);
