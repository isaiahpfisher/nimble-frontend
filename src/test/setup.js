import { config } from "@vue/test-utils";
import { beforeEach, vi } from "vitest";
import vuetify from "../plugins/vuetify.js";
import { CURRENT_USER } from "./fixtures.js";

// jsdom implements neither of these, and Vuetify uses both on mount.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.visualViewport = global.visualViewport ?? {
  addEventListener() {},
  removeEventListener() {},
  width: 1280,
  height: 800,
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }),
});

// Components that need a real browser: the chart needs canvas, Quill needs a
// live contenteditable, draggable needs pointer events. Stub them everywhere —
// the smoke tests care that the page around them renders, not that they work.
config.global.stubs = {
  Line: { template: "<div data-test-stub='chart' />" },
  QuillEditor: { template: "<div data-test-stub='quill' />" },
  draggable: {
    props: ["modelValue"],
    template: "<div data-test-stub='draggable'><slot name='item' v-for='element in modelValue' :element='element' /></div>",
  },
};

config.global.plugins = [vuetify];

// Node 24+ exposes its own `localStorage` global, and it shadows the jsdom one
// with a non-functional stub unless Node was started with --localstorage-file.
// Install a plain in-memory Storage so the app's localStorage reads behave.
const memoryStorage = (() => {
  let store = new Map();
  return {
    get length() {
      return store.size;
    },
    key: (index) => [...store.keys()][index] ?? null,
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => store.set(String(key), String(value)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
  };
})();

for (const target of [globalThis, window]) {
  Object.defineProperty(target, "localStorage", {
    configurable: true,
    writable: true,
    value: memoryStorage,
  });
}

beforeEach(() => {
  // Views read the signed-in user straight out of localStorage on mount.
  localStorage.clear();
  localStorage.setItem("user", JSON.stringify(CURRENT_USER));
  vi.clearAllMocks();
});
