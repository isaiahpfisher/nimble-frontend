# Nimble Frontend with Vue 3

[![codecov](https://codecov.io/gh/isaiahpfisher/nimble-frontend/branch/dev/graph/badge.svg)](https://codecov.io/gh/isaiahpfisher/nimble-frontend/branch/dev)

Please visit https://github.com/isaiahpfisher/nimble-backend for the backend repository.

## Project Setup

1. Clone the project into your **XAMPP/xamppfiles/htdocs/nimble-frontend** directory.

```
git clone https://github.com/isaiahpfisher/nimble-frontend
```

2. Install the project.

```
npm install
```

3. Make sure **Apache** is running.
   - We recommend using XAMPP to serve this project.
   - In XAMPP, make sure that **Apache** is running.

4. Compile and run the project locally.

```
npm run dev
```

5. Open http://localhost:8081 in a browser to view the project running.

6. (Optional) Compile the project for production.

```
npm run build
```

7. (Optional) Lint and fix the project files.

```
npm run lint
```

## Testing

The suite runs on [Vitest](https://vitest.dev) with [Vue Test Utils](https://test-utils.vuejs.org), and runs automatically on every pull request.

```
npm test           # watch mode
npm run test:run   # single run
npm run test:coverage
```

`src/test/pages.spec.js` is a smoke suite: it mounts every page in the router and checks that it renders real content without logging errors. The API is stubbed at a single point — the `apiClient` in `src/services/services.js` — with the canned responses in `src/test/fixtures.js`. A page that requests a URL with no fixture fails with a message naming the URL to add.

When you add a route, add it to the `PAGES` table in that spec; a coverage test fails if a route has no smoke test.
