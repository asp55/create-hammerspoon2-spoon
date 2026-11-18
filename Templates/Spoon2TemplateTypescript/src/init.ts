import { createLogger, type LogLevel } from "./modules/Logger";

const Logger = createLogger("Spoon2Template");

// Properties hs.spoons.load() copies onto the exported object from spoon.json.
interface SpoonMetadata {
    author?: string;
    description?: string;
    version?: string;
}

interface Spoon2Template extends SpoonMetadata {
    init(): void;
    start(): Spoon2Template;
    stop(): Spoon2Template;
    logLevel: LogLevel;
}

//-----------------------------------------
// Public API
//-----------------------------------------
const Spoon2Template = {} as Spoon2Template;

Spoon2Template.init = function (this: Spoon2Template) {
    // Called automatically by hs.spoons.load(). author/description/version are already set on
    // `this` by this point - safe to log or read, but this could run more than once, so avoid
    // anything that shouldn't happen twice.
    Logger.log(`v${this.version} initialized`);
};

Spoon2Template.start = function () {
    Logger.debug("start()");
    return Spoon2Template;
};

Spoon2Template.stop = function () {
    Logger.debug("stop()");
    return Spoon2Template;
};

// Properties
Object.defineProperties(Spoon2Template, {
    // Sets the level on this spoon's loggers: "error" | "warn" | "info" | "log" | "debug"
    logLevel: {
        get: () => Logger.level,
        set: (v: LogLevel) => { Logger.level = v; },
        enumerable: true,
    },
});

export = Spoon2Template;
