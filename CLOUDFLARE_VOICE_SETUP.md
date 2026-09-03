# Habla ElevenLabs voice setup on Cloudflare

Habla uses a Cloudflare Pages Function at `POST /api/tts`. The browser sends
only the text and canonical speaker name. The ElevenLabs API key remains an
encrypted Cloudflare secret and is never included in client JavaScript.

## Production setup

1. Create or open the Habla project in **Cloudflare Workers & Pages**.
2. Open **Settings → Variables and Secrets**.
3. Add `ELEVENLABS_API_KEY`.
4. Select **Encrypt**, save it, and redeploy.
5. Keep the Pages build output at the repository root. The `functions/api/tts.js`
   file automatically provides the `/api/tts` route.

The same secret can be added with Wrangler:

```powershell
npx wrangler pages secret put ELEVENLABS_API_KEY --project-name habla
```

## Local Cloudflare testing

Create a local `.dev.vars` file:

```dotenv
ELEVENLABS_API_KEY="your-private-key"
```

The file is ignored by Git. Run the site through the Pages runtime:

```powershell
npx wrangler pages dev .
```

Opening the app through a basic static server still works, but `/api/tts` will
not exist there. Habla will automatically fall back to the browser's Spanish
speech synthesis.

## Voice behavior

- Lesson and Practice audio use ElevenLabs Multilingual v2.
- Carlos's live chat replies use ElevenLabs Flash v2.5 for lower latency.
- Repeated generations are cached at Cloudflare's edge by speaker, text, and
  model.
- Named characters use their assigned voice.
- Vendors, servers, and shopkeepers share the vendor voice.
- Learner/customer model lines use the learner model voice.
- Unknown speakers safely fall back to Carlos.

The canonical voice IDs live only in
`functions/_shared/characterVoices.js`. Add aliases there when new story roles
are introduced.

## Security and cost controls

- Restrict the ElevenLabs key to text-to-speech permissions.
- Give the key a monthly credit quota.
- Add a Cloudflare rate-limiting rule for `POST /api/tts` before a public
  launch.
- Do not put the key in `wrangler.toml`, `js/`, GitHub Actions output, or the
  browser's local storage.
