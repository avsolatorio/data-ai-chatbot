# Frequently Asked Questions

Common questions and troubleshooting for Data360 Chat.

---

## General

### What models does the chatbot support?

The chatbot supports multiple AI models through LiteLLM, including OpenAI (GPT), Azure OpenAI, Anthropic (Claude), Google (Gemini), and others. The models available to you depend on your deployment configuration.

### Is my chat history saved?

Yes. Chats are stored in the database and associated with your account. Guest users may have limited persistence; sign in with an account for full history.

### Can I delete a chat?

Yes. Use the delete option in the chat menu or sidebar. Deletion is permanent.

---

## Data and charts

### Why didn't the AI use data tools for my question?

The AI routes questions to either a "research" mode (with data tools) or a "direct" mode (simpler, no data tools) based on your intent. If your question was interpreted as general knowledge, it may not have used data tools. Try rephrasing to be more specific about data (e.g. "find indicators about X" or "show me a chart of Y").

### The chart didn't load. What should I do?

- Check your connection.
- Try refreshing the page.
- If the issue persists, the Data360 MCP service may be temporarily unavailable. Try again later.

---

## Troubleshooting

### I'm logged out unexpectedly.

- Your session may have expired. Sign in again.
- If you recently changed your password, you may need to sign in again on all devices.
- After a deployment, sessions may be invalidated. Sign in again.

### The response is slow or hanging.

- Complex data queries and chart generation take longer. Wait for the "thinking" stages to complete.
- If it hangs for a long time, try stopping and rephrasing your question.
- Check with your administrator if the issue persists; the LLM or Data360 MCP service may be overloaded.

### I get an error when uploading a file.

- Check the file size limit. Large files may be rejected.
- Ensure the file type is supported (e.g. images, common document formats).
- Try a different file to rule out corruption.

---

## Need more help?

Contact your administrator or support team for deployment-specific issues.
