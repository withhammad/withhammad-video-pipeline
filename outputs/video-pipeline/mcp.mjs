// Local Codex MCP entry point for verified, direct account connections.
// Credentials stay in work/.secrets and are never returned by these tools.
import { McpServer } from '/Users/hammad/autonomous-marketing-os/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js'
import { StdioServerTransport } from '/Users/hammad/autonomous-marketing-os/node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(currentDir, '../..')
const configPath = path.join(currentDir, 'config.json')
const linkedinCredentialPath = path.join(root, 'work/.secrets/linkedin-oauth.json')
const youtubeCredentialPath = path.join(root, 'work/.secrets/youtube-oauth.json')
const server = new McpServer({ name: 'withhammad-direct', version: '0.1.0' })
const result = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] })

server.tool('connection_status', 'Read current direct connection state for the video pipeline; no external write and no credentials returned.', async () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  return result({
    heygen: { connected: config.heygen.connection_verified, avatarName: config.heygen.avatar_name },
    destinations: config.publishing.destinations.map(({ key, handle, profile_url, connection_status, provider, account_id }) =>
      ({ key, handle, profile_url, connection_status, provider: provider ?? null, account_id: account_id ?? null })),
    manychat: { workspace_url: config.manychat.workspace_url, connection_status: config.manychat.connection_status },
    website: { url: config.website.url, write_connection_verified: config.website.write_connection_verified },
  })
})

server.tool('linkedin_identity', 'Verify the authorized personal LinkedIn profile with a live direct API request; read-only.', async () => {
  if (!existsSync(linkedinCredentialPath)) throw new Error('Direct LinkedIn authorization is missing')
  const credential = JSON.parse(readFileSync(linkedinCredentialPath, 'utf8'))
  if (credential.expires_at_unix <= Date.now() / 1000) throw new Error('Direct LinkedIn authorization has expired')
  const raw = execFileSync('/usr/bin/curl', ['--silent', '--show-error', '--fail', '--max-time', '30',
    '--config', '-', 'https://api.linkedin.com/v2/userinfo'], {
    input: `header = "Authorization: Bearer ${credential.access_token}"\n`, encoding: 'utf8', timeout: 35000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const profile = JSON.parse(raw)
  if (!profile.sub || profile.sub !== credential.member_sub) throw new Error('LinkedIn identity differs from the configured owner')
  return result({ connected: true, name: profile.name, author_urn: `urn:li:person:${profile.sub}`,
    scopes: credential.scopes, expires_at_unix: credential.expires_at_unix, video_publish_tested: false })
})

server.tool('youtube_channel', 'Verify the authorized YouTube channel with a live direct Google API request; read-only.', async () => {
  if (!existsSync(youtubeCredentialPath)) throw new Error('Direct YouTube authorization is missing')
  const credential = JSON.parse(readFileSync(youtubeCredentialPath, 'utf8'))
  const client = JSON.parse(readFileSync(credential.client_file, 'utf8')).installed
  const form = new URLSearchParams({ client_id: client.client_id,
    client_secret: client.client_secret, refresh_token: credential.refresh_token,
    grant_type: 'refresh_token' })
  const tokenRaw = execFileSync('/usr/bin/curl', ['--silent', '--show-error', '--fail', '--max-time', '30',
    '--config', '-', 'https://oauth2.googleapis.com/token'], {
    input: `request = "POST"\nheader = "Content-Type: application/x-www-form-urlencoded"\ndata = "${form.toString()}"\n`,
    encoding: 'utf8', timeout: 35000, stdio: ['pipe', 'pipe', 'pipe'],
  })
  const token = JSON.parse(tokenRaw).access_token
  if (!token) throw new Error('Google refresh returned no access token')
  const raw = execFileSync('/usr/bin/curl', ['--silent', '--show-error', '--fail', '--max-time', '30',
    '--config', '-', 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true'], {
    input: `header = "Authorization: Bearer ${token}"\n`, encoding: 'utf8', timeout: 35000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const channel = (JSON.parse(raw).items ?? [])[0]
  if (!channel || channel.id !== credential.channel_id) throw new Error('YouTube channel differs from the configured owner')
  return result({ connected: true, id: channel.id, title: channel.snippet?.title,
    custom_url: channel.snippet?.customUrl, scopes: credential.scopes,
    video_publish_tested: false })
})

await server.connect(new StdioServerTransport())
