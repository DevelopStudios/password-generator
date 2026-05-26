# VaultKey

A password generator with in-browser AI mnemonics — no server, no API keys, no data sent anywhere.

**Live:** [password-generator-duah3.kinsta.page](https://password-generator-duah3.kinsta.page)

---

## What makes it interesting

Strong passwords are hard to remember. VaultKey generates a password and immediately creates a mnemonic to go with it — a deterministic word per character, then a vivid scene from a local LLM to make it stick.

Everything runs in the browser. The LLM (Qwen2.5-1.5B) runs via WebGPU in a Web Worker — no server round-trip, no inference API, nothing leaves the device.

---

## How it works

| Layer | Technology | Role |
|-------|-----------|------|
| Entropy | Web Crypto API | Cryptographically secure character selection |
| Word map | Deterministic lookup | Instant character → word mapping (always available) |
| Scene generation | Qwen2.5-1.5B-Instruct via WebLLM | Streams a vivid sentence from the word list — WebGPU only |
| Inference | Web Worker | Non-blocking — UI stays responsive during generation |
| Framework | Angular | Signals, standalone components |
| Testing | Playwright & Jasmine | Comprehensive E2E and Unit test coverage |

The word map is deterministic and renders instantly. The LLM scene is a progressive enhancement — if WebGPU isn't available (older hardware, mobile), the card still shows the word pairs without the scene.

---

## Stack

- **Framework:** Angular
- **AI Inference:** `@mlc-ai/web-llm` (WebGPU)
- **Security:** Web Crypto API
- **E2E Testing:** Playwright
- **Unit Testing:** Jasmine & Karma

---

## Run locally

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Navigate to `http://localhost:4200`

---

## Testing

VaultKey includes a robust test suite covering both logic and UI interactions.

### Unit Tests
Run component and service tests using Jasmine/Karma:
```bash
npm test
```

### End-to-End (E2E) Tests
Run browser automation tests with Playwright:
```bash
# Run all E2E tests
npm run e2e

# Run tests in UI mode
npm run e2e:ui
```

---

## WebGPU compatibility

WebGPU is required for the AI scene. Supported on:

- Chrome 113+ (desktop)
- Edge 113+ (desktop)

Not yet supported on Firefox or most mobile browsers. The password generator and word map work everywhere — only the scene is gated.
