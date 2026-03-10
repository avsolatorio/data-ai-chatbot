# Maintenance Mode

You can put the application into maintenance mode so users see a maintenance page instead of the chat interface.

---

## How to enable

Set the following in the **frontend** environment:

```env
MAINTENANCE_MODE=true
```

Restart or redeploy the frontend for the change to take effect.

---

## What users see

When maintenance mode is enabled, users are shown the maintenance page (e.g. at `/maintenance` or as the default route). The page typically explains that the service is temporarily unavailable and when it may be back.

---

## How to disable

Set:

```env
MAINTENANCE_MODE=false
```

Or remove the variable. Redeploy the frontend.

---

## Use cases

- Planned maintenance (database migrations, upgrades)
- Emergency takedown (security incident, critical bug)
- Gradual rollout (show maintenance to some users while others use the new version)
