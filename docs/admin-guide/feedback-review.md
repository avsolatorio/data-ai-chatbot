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

- **View feedback** — See all submitted feedback (text, rating, timestamp, submitter display name when logged in).
- **Filter and sort** — Depending on the UI, you may be able to filter by date, rating, or other criteria.
- **Response feedback tab** — Review thumbs and comments on assistant messages. Use **View conversation** for a quick side-panel preview, or **Open full conversation** for a dedicated read-only page.

---

## Read-only review chat

Reviewers can open a full conversation when that chat has **response-level feedback** (an up/down vote and/or a comment on an assistant message).

| Item | Detail |
|------|--------|
| **URL** | `/review/feedback/chat/[chatId]` — optional `?messageId=` scrolls to and highlights the flagged assistant message |
| **API** | `GET /api/feedback/review/chat/{chatId}` — same payload shape as `GET /api/chat/{id}` with `isOwner: false` and `reviewMode: true` |
| **Eligibility** | Returns **403** if the chat has no reviewable vote/feedback rows (reviewers cannot browse arbitrary private chats) |
| **Read-only** | No message input, no vote actions, no stream resume; normal `/chat/[id]` remains owner-only for private chats |

Direct links to `/chat/{id}` from the review UI are not used for flagged conversations, because private chats return **403** for non-owners on the standard chat API.

---

## Feedback submission

Users submit feedback via the in-app feedback form. Submissions are stored in the database and can be reviewed by authorized administrators. Feedback may be anonymous or associated with a user, depending on deployment.
