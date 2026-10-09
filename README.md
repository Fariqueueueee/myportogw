# Rebel Interface

Rebel Interface is a game-menu-inspired developer portfolio built with React 19,
native CSS, and Vite. Its five in-page screens—Home, Projects, Skills, About,
and Contact—share an event-driven angular wipe transition and an accessible
keyboard navigation model. Contact submissions travel through the same-origin
`/api/contact` path to a separate Express API.

The content in this repository is still a portfolio starter. Demo projects and
profile placeholders are deliberately identified rather than presented as real
client work.

## Technology stack

- Frontend: React 19, JavaScript, native CSS, Vite 8
- Backend: Node.js 24, Express 5.3.0
- Email: injectable mock adapter or Resend REST API via native `fetch()`
- Tests: the built-in `node:test` runner

No database, authentication, analytics, or client-side email credential is used.

## Project structure

```text
src/
  components/       Shared layout, navigation, transition, and UI components
  data/             Editable portfolio content
  hooks/            Menu, motion-preference, and transition state
  sections/         Home, Projects, Skills, About, and Contact screens
  services/         Browser contact API client
  styles/           Global, component, section, and motion CSS
server/
  scripts/          Mock-only browser test server
  src/contact/      Validation and injectable email adapters
  src/middleware/   CORS, rate limiting, and error handling
  test/             Backend and Resend adapter tests
test/               Frontend contact service and form-logic tests
```

## Requirements and installation

Use Node.js 24 and npm. From a fresh checkout, install the already-declared
dependencies without changing the lockfiles:

```powershell
cd C:\Users\Fariq\Documents\project\portof
npm ci
cd server
npm ci
```

No additional packages are required.

## Environment configuration

Copy `server/.env.example` to `server/.env`. Environment files are ignored by
Git; never place API keys in React source, Vite variables, browser storage, or
logs.

Safe local development configuration:

```dotenv
HOST=127.0.0.1
PORT=3001
FRONTEND_ORIGIN=http://127.0.0.1:4173
EMAIL_PROVIDER=mock
```

`EMAIL_PROVIDER=mock` is fail-closed: valid submissions return HTTP 503 and it
never claims provider acceptance or delivery. Resend mode additionally requires
`RESEND_API_KEY` in `server/.env`. The legacy `EMAIL_API_KEY` name remains
supported, but `RESEND_API_KEY` takes precedence. Do not enable Resend for routine
tests.

## Local development

Start the API in one PowerShell terminal:

```powershell
cd C:\Users\Fariq\Documents\project\portof\server
npm start
```

Start React in another terminal:

```powershell
cd C:\Users\Fariq\Documents\project\portof
npm run dev
```

Open `http://127.0.0.1:4173`. Vite proxies `/api/*` to
`http://127.0.0.1:3001` only during development.

For a browser flow that can return mock acceptance without using Resend, run
this instead of the normal backend:

```powershell
node server/scripts/contact-browser-mock.js
```

The fixture supports `[mock:slow]`, `[mock:reject]`, and `[mock:unavailable]`
inside the message for isolated UI checks. It logs only a request count and
never contacts an email provider.

## Commands

From the repository root:

```powershell
npm test          # frontend and backend node:test suites
npm run build     # production frontend bundle in dist/
npm run dev       # Vite development server
npm run preview   # preview the existing production bundle
```

From `server/`:

```powershell
npm test
npm run dev       # watch mode
npm start         # production-style process startup
```

Automated tests mock browser fetch and provider responses; they do not send a
real Resend request.

## Contact API

`POST /api/contact` accepts JSON containing only `name`, `email`, and `message`.
The server applies an 8 KB body limit, exact-origin CORS, server-side validation,
sanitized errors, and an in-memory request limit before invoking the configured
adapter. A `200` response means the provider accepted the request; it does not
confirm inbox delivery. See [server/README.md](server/README.md) for the response
contract and backend-specific configuration.

The frontend maps validation, rate-limit, timeout, network, origin, body-size,
media-type, provider rejection, and service-unavailable outcomes to safe form
feedback. An ambiguous timeout warns against an immediate retry because the
original request may still have reached the server.

## Content configuration checklist

Replace only with verified information:

- Name, role, headline, location, email, and social URLs: `src/data/profile.js`
- Biography, interests, journey, portrait path, principles, and CV path:
  `src/data/about.js`
- Project copy, screenshots, stacks, repository URLs, and live URLs:
  `src/data/projects.js`
- Skill categories and skill names: `src/data/skills.js`

Current project entries are demo concepts, project images are CSS placeholders,
public project links are unset, the profile portrait and CV are unset, and the
personal profile fields still need customization.

## Production deployment prerequisites

The frontend and backend are separate deployable processes. Viable topologies
include a reverse proxy on one HTTPS origin that routes `/api/*` to Express, or
separate HTTPS origins with a configured frontend API base URL and an exact
`FRONTEND_ORIGIN`. The current frontend intentionally uses a relative API URL,
so the first topology requires no browser-code change.

Before deployment:

- host `dist/` behind HTTPS and route `/api/*` to the Node service;
- set production `HOST`, `PORT`, `FRONTEND_ORIGIN`, and backend-only secrets;
- use a verified Resend domain and replace the test-only sender/recipient;
- add HTTPS/HSTS and frontend security headers at the edge;
- replace the single-process in-memory limiter with shared protection when
  running multiple instances;
- decide and validate the reverse-proxy trust model before enabling proxy IPs;
- add delivery-event/webhook handling if confirmed delivery is required;
- add centralized error monitoring and privacy-conscious operational logging;
- run manual screen-reader, real-device/touch, zoom/reflow, and production
  performance testing with final assets and content.

Vite's development proxy is not a production reverse proxy. No hosting provider
or deployment target is selected by this repository.

## Known limitations

- Contact success is provider acceptance only, not delivery confirmation.
- The mock provider intentionally returns unavailable; the browser fixture is
  test-only.
- Rate limits are process-local and reset when the API restarts.
- Project imagery, personal data, links, portrait, and CV remain placeholders.
- No automated browser, visual-regression, or screen-reader test dependency is
  installed; browser checks are currently manual.
- Accessibility-oriented semantics, keyboard support, focus management, reduced
  motion, and contrast were reviewed, but this is not a claim of WCAG conformance.
