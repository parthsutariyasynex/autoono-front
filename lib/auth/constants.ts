// Auth constants — namespaced so this project does NOT collide with
// other localhost projects. Browsers ignore the port for `localhost`
// cookies, so two apps that share a cookie name will overwrite each
// other's sessions. `autoono-front` is this project's unique prefix.
const APP_ID = "autoono-front";

export const APP_NAMESPACE = APP_ID;
export const SESSION_COOKIE_NAME = `${APP_ID}.session-token`;
export const CSRF_COOKIE_NAME = `${APP_ID}.csrf-token`;
export const CALLBACK_URL_COOKIE_NAME = `${APP_ID}.callback-url`;

// Every cookie this project owns — logout uses this list to wipe
// everything in one pass.
export const AUTH_COOKIE_NAMES = [
    SESSION_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    CALLBACK_URL_COOKIE_NAME,
] as const;
