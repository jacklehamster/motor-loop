# motor-loop

[![npm version](https://badge.fury.io/js/motor-loop.svg)](https://www.npmjs.com/package/motor-loop)

Motor loop is a typescript library that runs a game loop continuously.

Notably, it adapts to frameRate to ensure your game always runs smoothly when the monitor refresh rate goes above or below 60hz.

It's also used to schedule updates.

## Usage

```es6
  const motor = new Motor();

  //  This will cause your refresh method to be called continously at the frameRate specified
  motor.loop({
    refresh: (updatePayload) {
      //  execute continously
      doSomethingWith(updatePayload.data);
    }
  }, data, frameRate);
  
  //  You can also schedule an update. The update will only be executed one time
  motor.scheduleUpdate({
    refresh: (updatePayload) {
      //  update something
    }
  });
```

![](https://jacklehamster.github.io/motor-loop/icon.png)
## Install bun

https://bun.sh/

```bash
curl -fsSL https://bun.sh/install | bash
```

## Commands

- **start**: "bun run index.ts",
- **bundle**: "bun run bundler/bundler.ts",
- **list**: "bun run samples/list-scripts.tsx",
- **example**: "cd example && bun start && cd ..",
- **fileSample**: "bun run samples/file.tsx && cat samples/data/test.json",
- **httpSample**: "bun run samples/server.tsx"

## Run example

[https://jacklehamster.github.io/motor-loop/example/](https://jacklehamster.github.io/motor-loop/example/)

## Github Source

[https://github.com/jacklehamster/motor-loop/](https://github.com/jacklehamster/motor-loop/)
