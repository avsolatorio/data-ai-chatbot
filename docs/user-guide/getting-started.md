# Getting started

This page walks through **sign-in**, the **main screen**, and your **first messages** in Data360 Chat.

---

## Ways to sign in

Your administrator chooses which modes are enabled. You will only see the options that apply to your deployment.

### Guest (try without an account)

1. Choose **Continue as guest** (or similar).
2. A **guest session** is created. Chats are tied to that session.
3. If the deployment allows it, you can **register later** to keep history under a named account.

!!! note "Guest sessions"

    Guest behavior (how long sessions last, reset, rate limits) is configured on the server. If you “lose” guest history, the session may have expired or been reset—ask your admin if that is unexpected.

### Email and password

1. Open **Sign in** or **Register**.
2. Enter email and password (and complete registration if you are new).
3. After success you land in the **chat** view.

### Microsoft (Azure AD / MSAL)

1. Choose **Sign in with Microsoft** (wording may vary).
2. Complete your organization’s Microsoft login.
3. You return to the app **signed in** with your work identity.

### Data360 (embedded)

Some deployments run **inside the Data360 portal**. The parent app may set authentication for you so you do not see a separate chat login. If something fails, you may need to re-authenticate in Data360 first, then open the chat again.

---

## The main screen

| Area | Purpose |
|------|---------|
| **Sidebar** | Your **chat list** (today, yesterday, older). Start a **new chat**, rename, or delete. |
| **Header** | Chat title, actions (e.g. visibility), and sometimes **model** or environment hints. |
| **Message list** | Your messages and the assistant’s replies, including streaming text, tool blocks, and charts **inline** when the model returns them. |
| **Input** | Type a message, **attach** a file (if allowed), and **send**. |
| **Side panel** (when open) | **Artifacts**: documents, code, spreadsheets, or Vega charts the assistant is building or editing. |

---

## Send your first messages

1. Click **New chat** (or equivalent) if you want a fresh thread.
2. Type a question in the input and **send** (usually **Enter** to send; use your app’s hint if multiline input is supported).
3. Watch the reply **stream in**. For data questions you may see brief **thinking** or **tool** sections before the main answer.
4. **Scroll** the thread to read tables, code blocks, or embedded charts.

### First message ideas (Data360)

- “Find indicators about access to electricity in South Asia.”
- “What is the definition of indicator SP.POP.TOTL?”
- “Plot GDP per capita for Ghana and Côte d’Ivoire from 2000 to 2020.”
- “Compare female labor force participation for three countries I care about.”

### First message ideas (general)

- “Summarize this conversation so far in three bullets.”
- “Explain how to interpret the chart you just showed.”

---

## After your first reply

- Use **follow-up suggestion chips** under a reply when they appear—they fill the input with a suggested next question (if your deployment enables this).
- Try **thumbs up / down** or **feedback** on a message if you see them—this helps your team improve the service.
- Open [Chat features](chat-features.md) for stop, regenerate, tokens, and more.

---

## Next steps

- [Chat features](chat-features.md) — Streaming, stop, regenerate, voting, follow-ups, token usage  
- [Data analysis](data-analysis.md) — Indicators, charts, PCN  
- [FAQ](faq.md) — Troubleshooting  
