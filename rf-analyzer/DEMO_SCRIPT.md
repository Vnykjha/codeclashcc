# RF Signal Analyzer — 90-Second Demo Script

> Scenario preset: **Active Conflict**. Alert banner is firing. Dashboard is live.

---

## Beat 1 — Feed table (0–20 s)

"What you're seeing here is a live stream of synthetic RF signals hitting the classifier
at two per second. Each row is one signal — frequency, power, bandwidth, modulation type.
The colour coding tells you the classification at a glance: green rows are friendly comms
in the 136–174 MHz band, amber is unknown traffic in the 300–512 MHz range, and red is
hostile — high-power PSK and QAM signals up in the 2–4 GHz band, the kind you'd expect
from frequency-hopping emitters. That inline bar in the Threat column maps directly to
the score: anything hitting red is above the alert threshold of 70."

---

## Beat 2 — Threat chart (20–40 s)

"Over here on the right is the rolling threat score for the last 30 signals. You can
see it spiking repeatedly above that dashed red line — that's the alert threshold at 70.
Every time a hostile signal lands with high confidence and power above −50 dBm, the
score jumps to 100. The area fill under the curve makes the density of high-threat
windows immediately obvious. Right now in Active Conflict we're getting roughly half
our signals as hostile, so the chart is mostly red."

---

## Beat 3 — Switch to Peacekeeping (40–60 s)

_[click Peacekeeping button in top bar]_

"Watch what happens when I switch the scenario to Peacekeeping — 90% friendly traffic,
2% hostile. The feed table goes green almost immediately. The threat score metric card
stops pulsing, the alert banner clears itself after five seconds, and the chart flattens
out. The backend updates the signal generator in real time — no restart, no reconnect.
You can see the signals-per-second counter holding steady at 2, the WebSocket never
dropped."

---

## Beat 4 — Switch back to Active Conflict (60–80 s)

_[click Active Conflict button]_

"Back to Active Conflict — and within two or three seconds the hostile rows are back,
the threat score is climbing, and the banner fires again. That's the entire round trip:
signal generated, features extracted, Random Forest classifies it, threat score computed,
WebSocket event dispatched, React re-renders. All of that in under 500 milliseconds per
cycle."

---

## Beat 5 — Close on the model (80–90 s)

"The classifier is a 100-tree Random Forest trained on 6,000 synthetic signals — 2,000
per class — and it achieves 1.0 precision and recall on all three classes, because the
signal classes occupy non-overlapping frequency bands by design. The model is baked into
the Docker image at build time, so the container starts cold with no training delay."

---

_Total: ~90 seconds at a comfortable speaking pace._
