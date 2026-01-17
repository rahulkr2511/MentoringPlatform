# Push Notification Backend Design

## Overview
The Mentoring Platform backend delivers real-time session join alerts and near-session reminders to mentors and mentees. It stores browser push subscriptions, persists in-app notifications, and dispatches Web Push messages (VAPID-signed). The React client receives pushes via a service worker and mirrors the data in a notification drawer.

```
Client (Service Worker) <-- Web Push/VAPID --> Mentoring Platform Server
                                              |
                                              |-- Persist notification (Postgres/H2)
                                              |-- Queue & dispatch web push
```

## Components

### Data Model
- `push_subscriptions`: records `endpoint`, `p256dh_key`, `auth_key`, `user_id`, lifecycle timestamps, and `active` flag.
- `user_notifications`: stores notification metadata (`type`, `title`, `body`, `deep_link`, `meeting/session IDs`, `actor_user_id`, `payload_json`, `is_read`).

### Persistence & Access Layers
- `PushSubscriptionRepository` and `PushSubscriptionService` provide CRUD/upsert operations for browser subscriptions and deactivate stale entries.
- `UserNotificationRepository`/`NotificationService` create notifications, fetch the latest items (default 50), and handle read-state updates.

### REST Endpoints
- `POST /monitoringPlatform/push-subscriptions`: mentor/mentee clients upload or refresh subscriptions after granting push permission.
- `GET /monitoringPlatform/notifications`: retrieves recent in-app notifications.
- `PATCH /monitoringPlatform/notifications/{id}/read` and `POST /monitoringPlatform/notifications/mark-all-read`: read-state management for the notification drawer.
- `POST /monitoringPlatform/sessions/{sessionId}/presence/join`: emitted by the video client when a user joins; triggers notification creation and push dispatch to the counterpart.

### Domain Services
- `SessionService.recordSessionJoin(...)` validates the actor belongs to the session, persists a `SESSION_JOIN` notification for the opposite participant, and submits it to the dispatcher.
- `PushNotificationDispatcher` runs on a dedicated thread pool, loads active subscriptions for the recipient, shapes payload JSON, and calls `WebPushGateway`.
- `VapidWebPushGateway` signs Web Push requests, handles HTTP responses (including deactivating subscriptions on 404/410), and gracefully disables itself if VAPID credentials are absent or invalid.

### Configuration
- `application.properties`: dev defaults, JWT secret placeholder, push toggles (`push.dispatch.enabled`), and fallback H2 connection snippet for local dev without PostgreSQL.
- `application-prod.properties`: production overrides referencing environment variables for DB, JWT, and VAPID keys; sets stricter JPA settings (`ddl-auto=validate`, `show-sql=false`).
- Environment variables (with defaults) include:
  - `PUSH_DISPATCH_ENABLED`
  - `PUSH_VAPID_PUBLIC_KEY`
  - `PUSH_VAPID_PRIVATE_KEY`
  - `PUSH_VAPID_SUBJECT`
  - `SPRING_DATASOURCE_*`
  - `JWT_SECRET`, `JWT_EXPIRATION`
- `PushProperties` provides strongly typed access to push configuration and controls whether dispatch occurs at runtime.

### Deployment Checklist (See `Documentation/DEPLOYMENT_CHECKLIST.md`)
Key items:
1. Set `spring.profiles.active` (`prod` for production).
2. Supply VAPID keys via secrets manager/env vars.
3. Publish the public key to the React client build for service worker subscription.
4. Provide secure JWT secrets and database credentials.
5. Smoke-test `/sessions/{id}/presence/join` to ensure push events reach active browsers.

## Request Flow: Mentor/Mentee Join
1. Video client calls `POST /sessions/{sessionId}/presence/join`.
2. Server validates actor, persists `user_notifications` entry, pushes to dispatcher.
3. Dispatcher fetches mentor/mentee subscriptions and constructs payload (title/body/deep link).
4. `VapidWebPushGateway` signs message with provided keys and posts to the browser endpoint; errors are logged and subscriptions are disabled if necessary.
5. Service worker receives `push` event, updates the drawer context, and shows a desktop notification if the page isn’t focused.

## Running Locally
1. Ensure Postgres is available (default) **or** uncomment the H2 datasource block in `application.properties`.
2. `mvn -q spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.profiles.active=dev"`.
3. Optional: override dev VAPID keys with environment variables for end-to-end testing.

## Error Handling & Observability
- Dispatcher logs and skips dispatch if configuration is incomplete.
- Subscription send errors trigger subscription deactivation (404/410) or standard error logs for other failures.
- Optional metrics (future work) include queue depth, success/failure counters, and retry histograms.

## Extension Points
- Replace `VapidWebPushGateway` with another `WebPushGateway` (e.g., Firebase) via Spring component wiring.
- Add new notification types by extending `NotificationService` and reusing dispatcher/persistence layers.
- Implement dead-letter queue handling if push failures require retry beyond the default attempt.

