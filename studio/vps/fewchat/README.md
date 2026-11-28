# FewChat on the VPS (free, no Cloudflare)

FewChat (github.com/jasonc00person/fewchat, MIT) runs on amos-vps in Docker with Cloudflare's open-source
runtime (`wrangler dev --local` = workerd + local D1/queue/Durable Object). State persists in /opt/fewchat/data.

- Code: /opt/fewchat/src (git clone of upstream). Update: `git -C /opt/fewchat/src pull`, rebuild, restart.
- Settings: /opt/fewchat/fewchat.config.json (this folder). Secrets: /opt/fewchat/run/dev.vars (server only, 600).
- Console: https://fewchat.200-234-43-132.sslip.io/login (password copy: work/.secrets/fewchat-admin-password.txt).
  Move to chat.withhammad.cloud once its A record (-> 200.234.43.132) exists: change "url" here, rebuild, add the host to Caddy.
- Caddy block "BEGIN fewchat" in /opt/intake-relay/deploy/Caddyfile.
- Cron: start.sh hits /__scheduled every minute (Cloudflare would do this).
- Workers AI binding removed (only used to transcribe voice notes).

Rebuild + restart:
    cd /opt/fewchat && docker build -t fewchat:latest . && docker rm -f fewchat && \
    docker run -d --name fewchat --restart unless-stopped --network intake-relay_default --memory 700m \
      -v /opt/fewchat/data:/data -v /opt/fewchat/run:/run/fewchat:ro fewchat:latest
