# pxt-scheduler

Implements a single-threaded event loop. Allows users to schedule one-time and
repeating events using blocks.

## Blocks

### run event loop

This block actually runs the event loop, and should be placed in a "forever"
loop.

### do once

This block schedules an event to be run one time, `n` seconds after the program starts.

### do every

This block schedules an event to be run every `n` seconds after the program starts.

## TODO

- [ ] Add "icon.png" image (300x200) in the root folder
- [ ] Turn on your automated build on https://travis-ci.org
- [ ] Use "pxt bump" to create a tagged release on GitHub
- [ ] On GitHub, create a new file named LICENSE. Select the MIT License template.
- [ ] Get your package reviewed and approved https://makecode.adafruit.com/extensions/approval

Read more at https://makecode.adafruit.com/extensions

## Supported targets

* for PXT/codal
(The metadata above is needed for package search.)

