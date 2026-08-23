# VVLF Form

This repository contains the standalone VVLF Student Innovation & Portfolio Track application, including its public multi-step experience and protected application review route.

## Deployment configuration

Before deploying to Vercel, add the production database and authentication environment values that are used by the server template: `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, and `OWNER_NAME`. Add `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` if analytics should remain enabled. Do not commit these values.
