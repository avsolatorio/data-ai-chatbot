# FAQ

Common questions about **Data360 Chat** and the **Data AI Chatbot** experience.

---

## General

### What is the difference between “Data AI Chatbot” and “Data360 Chat”?

**Data AI Chatbot** is the **general** application: connect data through **MCP**, optional **PCN**, artifacts, and multiple auth modes. **Data360 Chat** is the **World Bank reference setup** that uses the **Data360 MCP Server** and development indicators—the scenario this user guide describes.

### Which AI models can I use?

Administrators connect models through **LiteLLM** (Azure OpenAI, OpenAI, Anthropic, Google, etc.). You only see what they **enable**. There may be a **model picker** in the UI, or a fixed default.

### Is my history saved?

**Signed-in** users: chats are usually **persisted** in the application database. **Guest** users: persistence depends on **guest session** settings—you may lose access if the session expires or you clear cookies.

### Can I delete a chat?

Yes, if your UI offers **delete** on the sidebar or chat menu. Deletion is typically **permanent** for that copy of the thread.

### What does token usage mean?

If shown, it is an **approximate** count of tokens for the visible turn or session. Use it for **orientation**; exact billing or quotas are defined by your **administrators** and cloud provider.

---

## Data, tools, and PCN

### Why didn’t the assistant call Data360 for my question?

Common cases:

- The model classified it as **general knowledge** (no tool needed).
- **MCP** or Data360 was **unreachable** (see errors in the reply or try again).
- Your phrasing was vague—try: “**Search indicators** for …” or “**Plot** … from Data360.”

### What do PCN badges mean?

**Proof-Carrying Numbers** label whether a **number in the reply** aligns with a **tool result**. **Verified** means grounded in returned data; **unverified** means stated without that trace. See [Data analysis](data-analysis.md#proof-carrying-numbers-pcn).

### The chart is blank or broken.

1. **Refresh** once.  
2. Try **another browser** (extensions sometimes block chart scripts).  
3. If it persists, **MCP**, **CDN**, or **CSP** settings may block resources—contact your administrator with the **time** and **chat id** if safe to share.

---

## Chat UI

### Follow-up chips look wrong or noisy.

Chips are **parsed suggestions** from the assistant text. Ignore them or edit before sending. They are not official Data360 queries.

### I don’t see thinking / tool steps.

Display depends on **model**, **routing**, and **deployment**. Some modes **collapse** reasoning. You should still see **final** answers and data.

### Stop didn’t work instantly.

**Stop** cancels **new** tokens; a small delay is normal. If generation never stops, **refresh** and report the issue.

---

## Files and uploads

### Upload failed immediately.

- Check **size** and **format**.  
- Try another **browser**.  
- Ask your admin for **limits** (`MAX_UPLOAD_*` / `NEXT_PUBLIC_*` settings).

---

## Account and access

### I was logged out suddenly.

- **Session expiry** or **password change**.  
- **Deployment** invalidated cookies (maintenance, security rotation).  
- **MSAL**: parent portal may need **re-login** before embedded chat works.

### Share link returns 403 or “not found.”

- Link **revoked** or **expired**.  
- Recipient lacks **permission** or must log in with an **allowed** account.

---

## Getting help

- **Organization**: internal **support** or **admin** for your deployment.  
- **Open source / bugs**: see the repository **[README](https://github.com/worldbank/data-ai-chatbot)** for issue tracker and contacts.
