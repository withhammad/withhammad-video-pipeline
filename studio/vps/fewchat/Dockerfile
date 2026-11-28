# FewChat (github.com/jasonc00person/fewchat) self-hosted on the VPS with Cloudflare's open-source runtime
# (workerd, through `wrangler dev --local`): D1, the queue, the Durable Object and the cron all run locally,
# state persists in /data. No Cloudflare account, no $5 plan.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY src/ ./
COPY fewchat.config.json ./
RUN npm ci --no-audit --no-fund \
 && node -e 'const f="wrangler.jsonc";let s=require("fs").readFileSync(f,"utf8");s=s.replace(/\n\s*"ai": \{ "binding": "AI" \},/,"");require("fs").writeFileSync(f,s)' \
 && ! grep -q 'REPLACE[_-]' wrangler.jsonc src/brand.ts
COPY db.mjs start.sh /opt/
ENV WRANGLER_SEND_METRICS=false CI=1
EXPOSE 8787
CMD ["sh", "/opt/start.sh"]
