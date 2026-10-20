# AI dashboard audit practice kit

Fictional sample, not client results. Each row is a complete order, not a line item. Currency AED; dates 1–6 October 2026. AI presenter in the accompanying reel.

Run `python3 audit.py` from any directory. It accepts no input path and refuses any sample data changes. It preserves orders.csv, writes cleaned-orders.csv and audit.json, and reports 15000 - 3000 = 12000. No dependencies or network access.

Open dashboard.html in a browser. The source/clean toggle uses embedded snapshots of the bundled checked data. This static dashboard does not automatically load modified CSVs.

Run `python3 test_audit.py` for arithmetic, repeated-ID, date, missing-value and currency checks. Repeated IDs in real datasets can be legitimate: never blindly delete them. Review real data with an approved private tool.
