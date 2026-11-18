import { createLogger, type LogLevel } from "./modules/Logger";

const Logger = createLogger("{{ name }}");

// Properties hs.spoons.load() copies onto the exported object from spoon.json.
interface SpoonMetadata {
    author?: string;
    description?: string;
    version?: string;
}

interface {{ identifier }} extends SpoonMetadata {
    init(): void;
    start(): {{ identifier }};
    stop(): {{ identifier }};
    logLevel: LogLevel;
}

//-----------------------------------------
// Public API
//-----------------------------------------
const {{ identifier }} = {} as {{ identifier }};

{{ identifier }}.init = function (this: {{ identifier }}) {
    // Called automatically by hs.spoons.load(). author/description/version are already set on
    // `this` by this point - safe to log or read, but this could run more than once, so avoid
    // anything that shouldn't happen twice.
    Logger.log(`v${this.version} initialized`);
};

{{ identifier }}.start = function () {
    Logger.debug("start()");
    return {{ identifier }};
};

{{ identifier }}.stop = function () {
    Logger.debug("stop()");
    return {{ identifier }};
};

// Properties
Object.defineProperties({{ identifier }}, {
    // Sets the level on this spoon's loggers: "error" | "warn" | "info" | "log" | "debug"
    logLevel: {
        get: () => Logger.level,
        set: (v: LogLevel) => { Logger.level = v; },
        enumerable: true,
    },
});

export = {{ identifier }};
