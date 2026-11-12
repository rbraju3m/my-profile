/**
 * Environment for the app under test. Real environment variables override
 * .env in Laravel, so the browser tests get their own SQLite database and
 * never touch the development one.
 */
export const PORT = Number(process.env.E2E_PORT ?? 8124);
export const BASE_URL = `http://127.0.0.1:${PORT}`;
export const SSR_PORT = Number(process.env.E2E_SSR_PORT ?? 13715);

export const ADMIN = { email: 'e2e-admin@example.test', password: 'e2e-password-123' };

export const appEnv: Record<string, string> = {
    APP_ENV: 'local',
    APP_DEBUG: 'false',
    APP_URL: BASE_URL,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: `${process.cwd()}/database/e2e.sqlite`,
    SESSION_DRIVER: 'file',
    CACHE_STORE: 'array',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'array',
    RESPONSE_CACHE_ENABLED: 'true',
    // Its own page-cache folder: sharing the dev site's would serve test pages (with test URLs) on the dev site.
    CACHE_FILE_PATH: `${process.cwd()}/storage/framework/cache/e2e`,
    ADMIN_REQUIRE_2FA: 'false',
    ADMIN_EMAIL: ADMIN.email,
    ADMIN_PASSWORD: ADMIN.password,
    TURNSTILE_SITE_KEY: '',
    TURNSTILE_SECRET_KEY: '',
    PHP_CLI_SERVER_WORKERS: '6',
    INERTIA_SSR_PORT: String(SSR_PORT),
    INERTIA_SSR_URL: `http://127.0.0.1:${SSR_PORT}`,
};
