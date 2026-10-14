# OCEAN & JUNGLE GAMES V7 — CLASSROOM EDITION

## Start
Extract ZIP to a folder and open **index.html** in Chrome/Edge. Works **offline**. Press **F11** for fullscreen.

## Gameplay
- Choose one or more numbers from **0 to 10** in Settings; every chosen number appears on a creature or banana. 11 selected -> 11 visible objects.
- Fish Adventure: hear a spoken number and click its marine animal. A rod drops the line and reels in correctly chosen creatures. Wrong choices escape inside their protected swimming area without overlapping adjacent animals.
- Feed the Monkey: pick the correct banana; the monkey approaches, bends its arm outward using a 2-bone inverse-kinematics calculation, reaches the fruit and brings it to its mouth. On wrong answers the monkey shakes its head with cartoon tears.
- Press **LISTEN CAREFULLY** to replay the voice; after two wrong choices the target is highlighted. Infinite play is optional.

## V7 upgrades
- Projection-first layout: smaller controls, significantly larger stage.
- Bigger numbered creatures and bananas; labels stay upright as fish reverse direction.
- Individual continuous curved orbits constrained to separate non-overlapping spatial cells. No collision bounces, random direction switches or sudden teleports. The crab remains near the bottom of its cell.
- Detailed vector silhouettes for clownfish, reef fish, shark, dolphin, octopus, crab and others.
- Monkey's upper arm and forearm pass through a physically coherent elbow. The wrist, gripping fingers and banana share matching coordinates at attachment time; reaching and eating follow separate animation phases.
- Read-only `window.__oceanQA()` console snapshot for diagnostics.

## Limitations
This is **stylized vector 2D**, not photorealistic or a bone-rigged 3D game. Speech quality depends on installed browser voices. Test the final display and audio on the intended classroom device.

## QA checked for this build
- Chromium headless rendering tested at 1366×768, 1920×1080 and 1024×768.
- All 1, 3, 4, 6, 8, 11 selections checked: exact set of numbers and finite, separated screen positions.
- Two wrong choices -> hint; correct fish -> score increment after catch; infinite one-number mode -> proper progress reset.
- Monkey approach, grip, carry and bite checked; arm upper/lower segment lengths verified during movement; top-row target keeps head visible.
- Browser runtime errors during tested scenarios: none.
- This is an automated QA pass, **not a guarantee of defect-free operation on all devices**.
