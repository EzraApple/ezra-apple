# Navigation measurements

Measured September 29, 2026, before deployment. Kept only the direct résumé URL
and an intent-based prefetch of its HTML document. The homepage remains static
and the résumé still opens in a new tab.

## Résumé navigation

Eight trials per condition, with order rotated each round:

| Condition | Median first contentful paint | Median first response byte |
| --- | ---: | ---: |
| Existing `/resume` link, no hints | 104 ms | 45.7 ms |
| Direct `/resume/` link, no hints | 92 ms | 35.7 ms |
| Direct link plus moderate prefetch | 68 ms | 9.8 ms |

The direct link avoids an existing Cloudflare 307 redirect, saving a request
even without speculation support. Prefetching improved first paint versus the
original in all eight pairs; versus the direct link alone it improved seven of
eight pairs. Chrome reported `navigational-prefetch` in every prefetched trial.
The combined median first-paint difference was 36 ms (about 35%). This is a
résumé-navigation result after 300 ms of hover, not a homepage speedup or a
guaranteed saving for every visitor.

The browser may fetch a document that the visitor never opens. Only `/resume/`
is eligible: approximately 4.1 KiB of gzip HTML in the current build, excluding
HTTP headers. The hint does not prerender, prefetch the PDF, or select external
sites or API/MCP endpoints. On desktop, `moderate` normally waits for hover
intent; on touch devices the browser may use viewport heuristics. Browsers may
ignore the hint, in which case the ordinary anchor still works.

The final homepage HTML increased by 76 gzip bytes, from 3,221 to 3,297 bytes.
Its complete initial payload budget measurement is 34,596 bytes including CSS,
fonts, and favicon; the speculative résumé fetch is additional if triggered.

## Other experiments

Six trials per condition and destination, median first contentful paint:

| Hint | Switchboard on GitHub | Replo article |
| --- | ---: | ---: |
| None | 344 ms | 228 ms |
| DNS prefetch | 340 ms | 262 ms |
| Preconnect | 340 ms | 270 ms |
| Preconnect on hover | 386 ms | 242 ms |

These did not demonstrate a reliable navigation improvement. Every tested
external document navigation established a new connection; explicit connection
warming did not eliminate its connection setup in these runs. Differences in
server response time and rendering were noisy. No external hints or hover
JavaScript were retained.

Prerender attempts reported `PrerenderingDisabledByDevTools`. They do not measure
prerender's potential benefit, so prerendering was excluded rather than credited
with an assumed improvement.

The unchanged production homepage already restored from the back/forward cache
in all five tests: same document, exact scroll position, and zero additional
homepage requests. The median interval from `pageshow` to two animation frames
was 30.5 ms; that is a restoration check, not a cold-load comparison. No change
was needed to enable this behavior.

## Method and limits

- Headless Google Chrome 154.0.8037.58, 1280 × 800 desktop viewport, on the local
  network without artificial throttling. No visible browser window was opened.
- Fresh isolated browser process for each timed navigation. Browser automation
  defaults that suppress background networking and back/forward caching were
  removed. OS DNS caches and CDN caches were not flushed.
- Actual production HTML, assets, and destinations. Candidate hints were added
  to the homepage DOM, without network interception or publishing changes.
  The final direct-link trials also replaced the résumé anchor's `href`.
- Identical 300 ms hover before clicking; destination timing came from browser
  Navigation/Paint Timing entries. Conditions ran sequentially in rotated order.
- Discarded pilot measurements used a shared browser or intercepted homepage;
  those are not included in the tables above.
- Results establish a benefit on this browser and network. Safari, Firefox,
  real mobile devices, and constrained mobile networks were not timed.

Local raw evidence and temporary runners are in the ignored
`outputs/navigation-benchmark/` directory: `canonical-results.jsonl`,
`live-origin-results.jsonl`, `bfcache-results.json`, and `local-verification.json`.
They are development artifacts, not deployed files.

## Final verification

- Production build and all 32 API/MCP/content tests passed. The payload check
  continues to reject executable scripts while permitting valid inline
  Speculation Rules JSON.
- Built local page passed desktop and 390 px mobile-emulation navigation checks:
  no overflow, no page errors, no redirect, and prefetch reused when available.
- A browser context with JavaScript disabled still opened the complete résumé
  in a new tab with a working PDF link and no redirect.
- No speculative request selected the PDF or API/MCP routes. Desktop page load
  alone did not request the résumé; hovering its link fetched its HTML once.
- The final local page retained back/forward-cache restoration in all five
  checks, including exact scroll position and no additional homepage request.
