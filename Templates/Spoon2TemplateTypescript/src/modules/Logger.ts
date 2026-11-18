// Levelled logger using the JavaScript console's method names and levels.
// Ordered from least to most verbose: error < warn < info < log < debug
export const LEVELS = { error: 0, warn: 1, info: 2, log: 3, debug: 4 } as const;

export type LogLevel = keyof typeof LEVELS;

export interface Logger {
    error(...params: unknown[]): void;
    warn(...params: unknown[]): void;
    info(...params: unknown[]): void;
    log(...params: unknown[]): void;
    debug(...params: unknown[]): void;
    level: LogLevel;
}

const DEFAULT_LEVEL: LogLevel = "log";

function assertLevel(value: string): asserts value is LogLevel {
    if (!(value in LEVELS)) {
        throw new Error(`invalid log level: ${value} (expected one of ${Object.keys(LEVELS).join(", ")})`);
    }
}

export function createLogger(name: string, initialLevel: LogLevel = DEFAULT_LEVEL): Logger {
    assertLevel(initialLevel);
    let level: LogLevel = initialLevel;
    const emit = (lvl: LogLevel, params: unknown[]): void => {
        if (LEVELS[lvl] <= LEVELS[level]) console[lvl](`[${name}]`, ...params);
    };
    const logger: Logger = {
        error: (...p) => emit("error", p),
        warn: (...p) => emit("warn", p),
        info: (...p) => emit("info", p),
        log: (...p) => emit("log", p),
        debug: (...p) => emit("debug", p),
        get level() { return level; },
        set level(value: LogLevel) {
            assertLevel(value);
            level = value;
        },
    };
    return logger;
}
