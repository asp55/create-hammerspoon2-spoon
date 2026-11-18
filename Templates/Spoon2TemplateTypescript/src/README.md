# {{ name }}

{{ description }}

## Installation

Double-click the `{{ name }}.spoon2` bundle to install it into Hammerspoon 2. Installing does not load it.

## Usage

Load the spoon from your Hammerspoon 2 config:

```js
hs.spoons.load("{{ name }}");
```

Nothing starts automatically, so call `start()` when you want it running (and `stop()` to stop it):

```js
hs.spoons["{{ name }}"].start();
```

To see more output in the Hammerspoon 2 console, set the log level (`"error"`, `"warn"`, `"info"`, `"log"` or `"debug"`):

```js
hs.spoons["{{ name }}"].logLevel = "debug";
```
