# Mentoring Platform – Deployment Checklist

Use this checklist whenever promoting a build to staging or production.

## Configuration Profiles
- [ ] Set the appropriate Spring profile (`spring.profiles.active`) in the runtime environment (`prod`, `staging`, etc.).
- [ ] Verify `Server/src/main/resources/application-prod.properties` (or the environment-specific equivalent) contains the correct overrides for:
  - `push.dispatch.enabled`
  - `push.vapid.public-key`
  - `push.vapid.private-key`
  - `push.vapid.subject`
- [ ] Provide secret values through the deployment pipeline or secrets manager; do not rely on repository defaults.

## Push Notifications
- [ ] Publish the **public** VAPID key to the React client build (service worker registration).
- [ ] Rotate VAPID keys if compromised; update both server profile file and CI/CD secrets.
- [ ] Confirm `PUSH_DISPATCH_ENABLED` is `true` for environments where push should run.

## Environment Variables
- [ ] Configure JWT secret (`jwt.secret`) and database credentials for the target environment.
- [ ] Supply any third-party API keys used by optional services (e.g., analytics, payment).

## Verification
- [ ] Smoke-test the join-session flow: trigger `/sessions/{id}/presence/join` and confirm a push notification lands on a subscribed browser.
- [ ] Validate in-app notification drawer syncs with the server via `GET /monitoringPlatform/notifications`.
- [ ] Monitor application logs for `VapidWebPushGateway` delivery results and ensure no subscriptions are unexpectedly disabled.

Keep this document updated as new deployment prerequisites are introduced.
