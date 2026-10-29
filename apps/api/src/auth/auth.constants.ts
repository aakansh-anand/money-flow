export const ACCESS_COOKIE_NAME = "kosh_access";
export const REFRESH_COOKIE_NAME = "kosh_refresh";
export const BCRYPT_ROUNDS = 12;

/** Access JWT must reach every API route. Refresh stays under /auth only. */
export const ACCESS_COOKIE_PATH = "/";
export const REFRESH_COOKIE_PATH = "/auth";
