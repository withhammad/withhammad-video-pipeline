# Style file: Stripe-style motion

Written by Claude Code from stripe.com's public CSS (homepage and its three stylesheets, read 2026-10-18).
Paste it at the top of every animation request. It copies colours, corners, shadow and motion, never the logo, the
name or the paid Söhne font (Inter is the free stand-in).

## Colour
- Ink (headings and body): #061b31 · soft text #50617a
- Brand purple: #533afd (buttons, links) · classic blurple #635bff · light #7f7dfc · deep #4032c8
- Dark surface: #061b31, lifted panels #0d253d and #1a2c44
- Light surface: #ffffff and #f6f9fc, hairlines #e5edf5
- Success: #00d66f
- The loud gradient, in this order: #ffd601 yellow → #ff6118 orange → #f44bcc magenta → #7232f1 violet → #533afd purple.
  Use it on one hero object per scene, never on text blocks.

## Shape
- Corners: 4px on small controls, 6px on cards and buttons, full pills for badges and pay buttons.
- Shadow (the double drop): 0 27px 40.5px -27px rgba(50,50,93,.25), 0 16.2px 32.4px -16.2px rgba(0,0,0,.1).
- Payment cards: 1.58:1, chip top left, "•••• 4242" in a monospace, expiry bottom right.

## Type
- Inter, weights 400 and 600 (800-900 only for one kinetic headline).
- Headlines letter-spacing -0.02em, body -0.01em. Numbers tabular.

## Motion
- Main curve: cubic-bezier(.25, 1, .5, 1) (a quick start that settles softly). Cards: cubic-bezier(.165, .84, .44, 1), 800 ms.
- Small things 300 ms, panels 500-800 ms. Nothing bounces more than once.
- Things snap into place and then hold still; one change per scene.
- Every scene is a 6 second loop whose last frame matches its first.
