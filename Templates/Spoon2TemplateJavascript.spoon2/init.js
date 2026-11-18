
const { createLogger } = require("./modules/Logger.js");

const Logger = createLogger("{{ name }}");


//-----------------------------------------
// Public API
//-----------------------------------------
const {{ identifier }} = {};

{{ identifier }}.init = function () {
    // Called automatically by hs.spoons.load(). author/description/version are already set on
    // `this` by this point - safe to log or read, but this could run more than once, so avoid
    // anything that shouldn't happen twice.
    Logger.log(`v${this.version} initialized`)
};



{{ identifier }}.start = function() {
    Logger.debug("start()");
    return {{ identifier }};
}

{{ identifier }}.stop = function() {
    Logger.debug("stop()");
    return {{ identifier }};
}

// Properties
Object.defineProperties({{ identifier }}, {
    // Sets the level on this spoon's loggers: "error" | "warn" | "info" | "log" | "debug"
    logLevel: {
        get: () => Logger.level,
        set: (v) => { Logger.level = v; },
        enumerable: true,
    },
});

module.exports = {{ identifier }};
