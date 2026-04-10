# File attachments

Attach files to a message so the assistant can **see** them in context (subject to your deployment’s limits and policies).

---

## What is usually supported

| Kind | Typical support |
|------|-----------------|
| **Images** | Common formats such as **PNG**, **JPEG**, **GIF** (exact list set by administrators). |
| **Other files** | May be **disabled** or limited; ask your admin if uploads fail or options are missing. |

The app generally validates **size** and **type** on both **browser** and **server** so oversized or disallowed files are rejected early.

---

## How to attach

1. Click the **attachment** or **paperclip** control in the message input.
2. Choose **one or more** files (if the UI allows multiples).
3. Confirm previews look correct, add your **prompt**, then **send**.

---

## Writing a good prompt with an image

- **Describe the task** — “Extract the three bullet points from this slide” or “What chart type is this?”
- **State constraints** — “Answer in one paragraph” or “List numbers only if visible in the image.”
- **Avoid sensitive data** if your policy restricts certain content—even if the model can read the file.

---

## Limits and errors

- **File size** — If upload fails immediately, try a **smaller** image or compress it.
- **Type** — If the server rejects the MIME type, convert to **PNG** or **JPEG**.
- **Corporate networks** — Rarely, proxies block multipart uploads; try another network or contact IT.

Administrators configure limits via environment variables (e.g. max bytes and allowed image types).

---

## Privacy

- Treat uploads like **organizational data**: use the same rules as email or shared drives.
- **Guest** sessions may still **store** attachments server-side for the chat record—do not upload **classified** or **personal** data unless policy allows.

---

## See also

- [FAQ](faq.md) — Upload errors  
- [Chat features](chat-features.md) — Message flow after send  
