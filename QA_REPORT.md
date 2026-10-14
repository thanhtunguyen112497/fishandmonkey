# V7 — Test report

Automated runtime: Headless Chromium with injected local HTML, CSS and JavaScript (browser administrator policy blocks file:// and localhost navigation in this test environment; manual offline opening should use Chrome or Edge).

- All 11 numbers rendered simultaneously in both game modes.
- Fish test matrix: **18 passes** (6 number selections × 3 screen sizes).
- All fish positions finite and independent swimming envelopes.
- Error scenarios: wrong fish; second wrong leads to anchored hint; correct fish adds one point only after animation.
- Infinite one-number round resets progress and retains accumulated score.
- Monkey test: incorrect answer response, approach, wrist/arm IK lengths, gripping, return, score; verified upper and lower limb length in script.
- Monkey's head remains within the scene when picking the topmost banana.
- JavaScript: syntax valid; no uncaught browser errors in tested scenarios.

Graphics are stylized vector Canvas 2D. Offline text-to-speech is supplied by the browser and may vary across computers.
