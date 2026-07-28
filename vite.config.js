import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dns from "dns";
dns.setDefaultResultOrder("verbatim");
// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from "vite-plugin-vuetify";

export default () => {
  // Allow the deployment base path to be overridden at build time (e.g. the
  // Docker/nginx image serves the app at "/"). Falls back to the legacy
  // subpath used by the AWS static deploy when APP_BASE is not provided.
  const baseURL =
    process.env.APP_BASE ??
    (process.env.APP_ENV === "development" ? "/" : "/nimble-frontend/");

  return defineConfig({
    plugins: [vue(), vuetify({ autoImport: true })],

    server: {
      host: "localhost",
      port: 8081,
    },
    base: baseURL,

    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.js"],
      // Print every page as it is tested rather than a single summary line.
      reporters: ["verbose"],
      // Vuetify ships untranspiled ESM that Vitest cannot externalize.
      server: { deps: { inline: ["vuetify"] } },
      coverage: {
        provider: "v8",
        // lcov is what Codecov reads; text prints a summary in the CI log.
        reporter: ["text", "lcov"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.{js,vue}"],
        exclude: ["src/test/**", "src/plugins/**", "src/main.js"],
      },
    },
  });
};
