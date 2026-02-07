# Deployment Guide - Railway

## Prerequisites

- GitHub repo: https://github.com/weijianzhg/eve-transparent-fund
- Railway account: https://railway.app
- Railway CLI installed: `npm install -g @railway/cli`

## Option 1: CLI Deployment (Recommended)

### Steps

1. **Login to Railway** (requires browser)
   ```bash
   cd eve-transparent-fund
   railway login
   ```
   This opens a browser for authentication.

2. **Initialize Project**
   ```bash
   railway init
   ```
   Select "Create new project" and name it "eve-baseline-api"

3. **Deploy**
   ```bash
   railway up
   ```

4. **Get the URL**
   ```bash
   railway domain
   ```
   This gives you the public URL (e.g., `eve-baseline-api.up.railway.app`)

5. **Update Skill File**
   Edit `BASELINE-VOTING.md` and replace:
   ```
   API Base: https://eve-baseline-api.up.railway.app
   ```
   With your actual Railway URL.

## Option 2: GitHub Integration (Alternative)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `weijianzhg/eve-transparent-fund`
4. Railway auto-detects Node.js project
5. Set custom start command: `npm run start:api`
6. Click "Deploy"
7. Once deployed, click "Settings" → "Generate Domain"
8. Copy the URL and update `BASELINE-VOTING.md`

## Verification

Once deployed, test the health endpoint:

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/baseline/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T..."
}
```

## Monitoring

View logs:
```bash
railway logs
```

Or via web: https://railway.app/dashboard → Select project → Logs

## Environment Variables (if needed)

Railway doesn't need any env vars for this project (it's stateless with in-memory storage).

If you want to add persistence later:
```bash
railway variables set KEY=value
```

## Cost

Railway free tier includes:
- $5 credit/month
- Enough for this API (minimal compute)
- Public URL included

## Next Steps After Deployment

1. Update `BASELINE-VOTING.md` with real URL
2. Test all endpoints with real Colosseum token
3. Announce in forum with skill file link
4. Monitor usage via Railway dashboard

## Troubleshooting

**Build fails:**
- Check logs: `railway logs --build`
- Verify `railway.toml` and `package.json` are correct

**Can't access URL:**
- Ensure domain is generated: `railway domain`
- Check if service is running: `railway status`

**Auth errors:**
- Token consistency checks are working as designed
- First request locks token to agentId
