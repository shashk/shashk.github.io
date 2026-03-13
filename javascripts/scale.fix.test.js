import { expect, test, describe, beforeEach } from "bun:test";
import fs from "fs";
import path from "path";

const scriptPath = path.resolve(import.meta.dir, "scale.fix.js");
const scriptContent = fs.readFileSync(scriptPath, "utf8");

describe("scale.fix.js", () => {
    let mockDocument;
    let mockNavigator;
    let metaTags;
    let eventListeners;

    beforeEach(() => {
        eventListeners = {};
        metaTags = [
            { name: "viewport", content: "" }
        ];

        mockDocument = {
            getElementsByTagName: (tagName) => {
                if (tagName === 'meta') return metaTags;
                return [];
            },
            addEventListener: (event, callback) => {
                eventListeners[event] = callback;
            }
        };

        mockNavigator = {
            userAgent: ""
        };

        // Set up globals
        globalThis.document = mockDocument;
        globalThis.navigator = mockNavigator;
    });

    test("initializes viewport on iPhone", () => {
        mockNavigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1";

        // Execute the script
        new Function(scriptContent)();

        expect(metaTags[0].content).toBe("width=device-width, minimum-scale=1.0, maximum-scale=1.0");
        expect(eventListeners["gesturestart"]).toBeDefined();
    });

    test("does not initialize on non-iPhone", () => {
        mockNavigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

        // Execute the script
        new Function(scriptContent)();

        expect(metaTags[0].content).toBe("");
        expect(eventListeners["gesturestart"]).toBeUndefined();
    });

    test("gestureStart updates viewport content", () => {
        mockNavigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";

        // Execute the script
        new Function(scriptContent)();

        // Trigger gesturestart
        const gestureStartFn = eventListeners["gesturestart"];
        expect(gestureStartFn).toBeDefined();

        gestureStartFn();

        expect(metaTags[0].content).toBe("width=device-width, minimum-scale=0.25, maximum-scale=1.6");
    });
});
