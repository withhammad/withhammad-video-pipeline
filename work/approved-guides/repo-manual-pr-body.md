Add the guides and keyword reply rules required for the approved corrected REPO reel and GUARD infographic. The owner will upload REPO from the phone with a native platform sound. Its unrestricted REPO keyword rule also matches those manual Instagram uploads.

Fix Instagram's follow gate: a missing, malformed or unavailable follow check now offers a retry and withholds the guide. Only an explicit `is_user_follow_business: true` releases the link. A failed private send no longer produces a public “Sent you a DM” confirmation or records the comment as delivered.

Validation:

- Nine signed-webhook tests pass using mocked Graph requests: manual upload comments, confirmed followers, non-followers, unavailable/invalid checks, network failures, failed delivery and invalid signatures. No real customer messages are sent by these tests.
- Production build, TypeScript and lint pass; lint reports five existing image warnings.
- Resource page previews previously returned 200 with one H1, no overflow at 390/1280px and Lighthouse SEO 100. This update changes only webhook handling and adds its tests.
- Pipeline suite: 646 passed, one existing deprecation warning.
- Production Instagram identity and comment/message subscriptions are healthy; signed empty webhook and verification challenge return 200. These are connectivity checks, not proof of a real customer's DM.

Release remains blocked on this PR's merge and production checks. The owner will publish REPO manually, then its live comment → follow → DM flow will be verified against that post. No REPO automatic upload or two-hour fallback is booked. YouTube replies are public and cannot reliably enforce subscriptions that users keep private.
