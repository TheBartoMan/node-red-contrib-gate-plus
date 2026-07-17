module.exports = function (RED) {
    "use strict";

    function GatePlusNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.controlTopic = config.controlTopic || "control";
        node.defaultState = config.defaultState === "closed" ? "closed" : "open";
        node.openCmd = String(config.openCmd || "open").toLowerCase();
        node.closeCmd = String(config.closeCmd || "close").toLowerCase();
        node.toggleCmd = String(config.toggleCmd || "toggle").toLowerCase();
        node.defaultCmd = String(config.defaultCmd || "default").toLowerCase();
        node.statusCmd = String(config.statusCmd || "status").toLowerCase();
        node.persist = !!config.persist;
        node.storeName = config.storeName || "default";

        const CONTEXT_KEY = "gatePlusState";

        function showStatus(state) {
            if (state === "open") {
                node.status({ fill: "green", shape: "dot", text: "open" });
            } else {
                node.status({ fill: "red", shape: "ring", text: "closed" });
            }
        }

        // `currentState` is the single source of truth, read/written
        // synchronously everywhere. `initialized` only exists to delay
        // the first message until any persisted state has loaded.
        let currentState = node.defaultState;

        const initialized = node.persist
            ? Promise.resolve(node.context().get(CONTEXT_KEY, node.storeName))
                .then((saved) => {
                    if (saved === "open" || saved === "closed") {
                        currentState = saved;
                    }
                })
                .catch((err) => {
                    node.warn("Could not read saved gate state: " + err.message);
                })
                .finally(() => showStatus(currentState))
            : Promise.resolve().then(() => showStatus(currentState));

        function setState(state) {
            currentState = state;
            if (node.persist) {
                Promise.resolve(
                    node.context().set(CONTEXT_KEY, state, node.storeName)
                ).catch((err) => {
                    node.warn("Could not save gate state: " + err.message);
                });
            }
            showStatus(state);
        }

        node.on("input", function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments); };
            done = done || function (err) { if (err) node.error(err, msg); };

            initialized
                .then(() => {
                    if (msg.topic === node.controlTopic) {
                        let cmd = msg.payload;
                        if (typeof cmd === "number" || typeof cmd === "boolean") {
                            cmd = String(cmd);
                        }
                        if (typeof cmd !== "string") {
                            node.warn("Unrecognized control payload: " + JSON.stringify(msg.payload));
                            return;
                        }
                        cmd = cmd.toLowerCase();

                        if (cmd === node.openCmd) {
                            setState("open");
                        } else if (cmd === node.closeCmd) {
                            setState("closed");
                        } else if (cmd === node.toggleCmd) {
                            setState(currentState === "open" ? "closed" : "open");
                        } else if (cmd === node.defaultCmd) {
                            setState(node.defaultState);
                        } else if (cmd === node.statusCmd) {
                            showStatus(currentState);
                        } else {
                            node.warn("Unrecognized control command: " + cmd);
                        }
                        // Control messages never appear on either output.
                        return;
                    }

                    // Ordinary data message: route by current state.
                    if (currentState === "open") {
                        send([msg, null]);
                    } else {
                        send([null, msg]);
                    }
                })
                .then(() => done(), (err) => done(err));
        });
    }

    RED.nodes.registerType("gate-plus", GatePlusNode);
};
