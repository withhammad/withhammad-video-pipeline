# Comment → DM → follow → link funnel (ManyChat + Instagram)

Researched and adversarially fact-checked on 2026-10-17 (workflow `manychat-follow-gate-research`, 32 claims
confirmed, 4 refuted, 2 unverified). Sources: manychat.com/pricing, help.manychat.com plan/automation/system-field
articles, api.manychat.com/swagger, Meta Instagram Platform messaging/private-replies docs, Meta Spam Community
Standard and Developer Policies, help.instagram.com recommendation guidelines.

## Facts that drive the design
- **ManyChat plan:** workspace `fb5064597` is on the new **Free** plan: 25 Active Contacts per month (16 used on
  2026-10-17), max 4 live automations, "Powered by Manychat" branding. Every commenter who gets a DM is an
  Active Contact, so Free can't carry a real reel.
- **Essential ($17/mo, $14/mo annual, 250 contacts, 14-day trial)** is the cheapest plan with Follower Status Check
  and Conditions. Pro ($39/mo) adds AI and the API, but **the API cannot create flows, triggers or comment
  automations**, so it doesn't help automate per-reel setup. Setup per reel is done in the ManyChat UI (by
  hand or via the owner's Chrome).
- **Meta rules:**
  - One private reply per comment, within 7 days.
  - Further messages only within 24 h after the user taps or replies.
  - Follow status is readable only after that consent.
  - 750 private replies per hour.
  - Users with closed message requests won't receive the DM, so keep "link in bio" as the fallback.
- **Policy:** withholding promised content unless someone follows matches the Spam Community Standard's
  "like/share-gating" and "required to engage before promised content" clauses. **Design: everyone who asks gets
  the link; following is an invitation, not a condition.**
- **Reach:** "Comment WORD" CTAs can reduce recommendations, and repeated automated public comment replies are a common
  cause of comment limits, so rotate 5–10 reply variants. Instagram won't recommend accounts that repeatedly
  post photorealistic AI people without the account's **AI-generated label**, so set that label on any account
  that posts HeyGen avatar reels, plus the per-post AI disclosure.
- ManyChat's "Follows your Instagram account" condition misfires and sometimes returns "Invalid Variable" for
  real followers. Never let it decide whether someone gets the link.

## The flow (per reel)
1. Caption CTA: "Comment BLUEPRINT and I'll DM you the guide."
2. Trigger: "User comments on your Post or Reel" → the specific reel; keywords `BLUEPRINT, Blueprint, blueprint`.
3. Public reply (rotating 5–10 variants), e.g. "Sent! Check your DMs (and Message Requests) 📩".
4. Private reply (the one allowed message): "Hey {first_name}! Tap below and I'll send you the BLUEPRINT." + quick-reply
   button "Send me the link" (the tap opens the 24 h window and gives consent; URL buttons don't count).
5. After the tap, everyone gets the link DM: resource page on withhammad.com + "Want the next one? Follow @<account>
   — I post a new breakdown every week." + a "Follow" profile link.
6. Essential and above, optional: a follow-status Condition that only changes the wording (thank followers or
   invite non-followers); the link goes out in every branch, including Invalid.

## Owner decisions needed
- Upgrade ManyChat to Essential (recommended; the Free cap is nearly used up) — owner approval required.
- Which Instagram account carries the funnel (ManyChat is connected to @with.hammad; the avatar reel is
  publishable today on @hammadagentic.ai).
- Turn on the AI-generated profile label on accounts that post avatar reels.
