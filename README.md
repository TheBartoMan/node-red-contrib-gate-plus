# node-red-contrib-gate-plus

A Node-RED gate node with two outputs: one for messages that pass through
while `open`, and one for messages that arrive while `closed` — so you can
still do something with a blocked message instead of losing it.

This node was inspired by the excellent
[node-red-contrib-simple-gate](https://github.com/drmibell/node-red-contrib-simple-gate)
by M. I. Bell, which discards messages while closed. If you want blocked
messages *queued and replayed later* rather than routed live, that node's
companion [node-red-contrib-queue-gate](https://flows.nodered.org/node/node-red-contrib-queue-gate)
is worth a look too. `gate-plus` is a fresh implementation with an
overlapping feature set, released separately under Apache-2.0.

## Install

From your Node-RED user directory (typically `~/.node-red`):

```
npm install node-red-contrib-gate-plus
```

Or use the `Manage Palette` command in the Node-RED editor.

## Usage

The node has **one input** and **two outputs**:

- **Output 1 ("open")** — the message, passed straight through, when the
  gate is open.
- **Output 2 ("blocked")** — the message, routed here instead of being
  discarded, when the gate is closed.

Messages whose `msg.topic` matches the configured **Control Topic**
(default `control`) are never sent to either output — they're used only to
change the gate's state. Recognised control payloads (each customisable,
case-insensitive):

| Command   | Effect                                  |
|-----------|------------------------------------------|
| `open`    | Opens the gate                           |
| `close`   | Closes the gate                          |
| `toggle`  | Flips the current state                  |
| `default` | Resets to the configured Default State   |
| `status`  | Refreshes the node's status indicator    |

## State persistence

Tick **Restore from state saved in** and choose a context store to persist
the gate's state across redeploys and Node-RED restarts. If no valid saved
state is found, the node falls back to **Default State**.

## Example

```
[inject] --> [gate-plus] --output 1 (open)----> [normal processing]
                        \--output 2 (blocked)--> [logging / alerting / anything else]

[open/close/toggle inject] --topic: control--> [gate-plus]
```

## License

Apache-2.0
