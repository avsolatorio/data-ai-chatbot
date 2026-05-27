"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type McpDocsCodeSnippetProps = {
  code: string;
  language?: string;
};

export function McpDocsCodeSnippet({
  code,
  language = "json",
}: McpDocsCodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mcp-docs-code-wrap">
      <button aria-label="Copy code" onClick={copy} type="button">
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </button>
      <div>
        <SyntaxHighlighter language={language} style={oneDark}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
