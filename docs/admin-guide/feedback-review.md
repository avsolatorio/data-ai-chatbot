# Feedback Review

Administrators can review user-submitted feedback through the feedback review page.

---

## Access

- **URL:** `/review/feedback` (e.g. `https://chat.example.com/review/feedback`)
- **Requirement:** Your email must be in the `FEEDBACK_REVIEWER_EMAILS` environment variable (comma-separated list) on the backend.

---

## Configuration

Add reviewer emails to `backend/.env`:

```env
FEEDBACK_REVIEWER_EMAILS=admin@example.com,reviewer@example.com
```

Only users whose email matches one of these addresses can access the feedback list.

---

## What you can do

- **View feedback** — See all submitted feedback (text, rating, timestamp, optional user info).
- **Filter and sort** — Depending on the UI, you may be able to filter by date, rating, or other criteria.

---

## Feedback submission

Users submit feedback via the in-app feedback form. Submissions are stored in the database and can be reviewed by authorized administrators. Feedback may be anonymous or associated with a user, depending on deployment.
