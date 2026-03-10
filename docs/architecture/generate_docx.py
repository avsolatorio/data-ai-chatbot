#!/usr/bin/env python3
"""
Generate a nicely formatted Word document from the architecture Markdown files.
Requires: python-docx (pip install python-docx)
Output: docs/architecture/Data360-Chat-Architecture.docx
"""

import re
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def add_hyperlink(paragraph, text, url):
    """Add a hyperlink to a paragraph."""
    part = paragraph.part
    r_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    new_run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    new_run.append(rPr)
    new_run.append(OxmlElement("w:t", text=text))
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink


def parse_inline_formatting(text):
    """Yield (text, bold, italic) runs for a line."""
    if not text:
        yield ("", False, False)
        return
    # Simple parser: **bold** and *italic*
    pattern = r"(\*\*[^*]+\*\*|\*[^*]+\*|[^*]+)"
    for part in re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*)", text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            yield (part[2:-2], True, False)
        elif part.startswith("*") and part.endswith("*") and not part.startswith("**"):
            yield (part[1:-1], False, True)
        else:
            yield (part, False, False)


def add_formatted_paragraph(doc, line, style="Normal"):
    """Add a paragraph with **bold** and *italic* preserved."""
    p = doc.add_paragraph(style=style)
    for text, bold, italic in parse_inline_formatting(line.strip()):
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
    return p


def parse_markdown_table(lines, start_idx):
    """Parse a markdown table, return (rows, next_index)."""
    rows = []
    i = start_idx
    while i < len(lines):
        line = lines[i]
        if "|" in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.split("|")[1:-1]]
            # Skip separator row (|---|---|)
            if cells and not re.match(r"^[-:\s]+$", "".join(cells)):
                rows.append(cells)
            i += 1
        else:
            break
    return rows, i


def add_table_to_doc(doc, rows, style="Table Grid"):
    """Add a table to the document with nice formatting."""
    if not rows:
        return
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = style
    for r, row in enumerate(rows):
        for c, cell_text in enumerate(row):
            if c < len(table.rows[r].cells):
                cell = table.rows[r].cells[c]
                # Strip ** for header row
                text = re.sub(r"\*\*([^*]+)\*\*", r"\1", cell_text)
                cell.text = text
                if r == 0:
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.bold = True
    doc.add_paragraph()


def process_code_block(doc, code_lines):
    """Add a code block with monospace font and light gray background."""
    code_text = "\n".join(code_lines)
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.right_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(code_text)
    run.font.name = "Consolas"
    run.font.size = Pt(9)
    # Paragraph fill (light gray)
    pPr = p._p.get_or_add_pPr()
    pShd = OxmlElement("w:shd")
    pShd.set(qn("w:fill"), "F2F2F2")
    pShd.set(qn("w:val"), "clear")
    pPr.append(pShd)
    doc.add_paragraph()


def convert_md_to_docx(doc, md_paths):
    """Read markdown files and append content to the given document."""
    for md_path in md_paths:
        if not md_path.exists():
            continue
        content = md_path.read_text(encoding="utf-8")
        lines = content.split("\n")

        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()

            # Code block
            if stripped.startswith("```"):
                code_lines = []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith("```"):
                    code_lines.append(lines[i])
                    i += 1
                if i < len(lines):
                    i += 1
                if code_lines:
                    process_code_block(doc, code_lines)
                continue

            # Headers
            if stripped.startswith("# "):
                doc.add_heading(stripped[2:].strip(), level=0)
                i += 1
                continue
            if stripped.startswith("## "):
                doc.add_heading(stripped[3:].strip(), level=1)
                i += 1
                continue
            if stripped.startswith("### "):
                doc.add_heading(stripped[4:].strip(), level=2)
                i += 1
                continue

            # Horizontal rule
            if stripped in ("---", "***", "___"):
                doc.add_paragraph()
                i += 1
                continue

            # Table
            if "|" in stripped and stripped.startswith("|"):
                rows, i = parse_markdown_table(lines, i)
                add_table_to_doc(doc, rows)
                continue

            # Bullet list
            if stripped.startswith("- ") or stripped.startswith("* "):
                text = stripped[2:].strip()
                p = doc.add_paragraph(style="List Bullet")
                for t, b, it in parse_inline_formatting(text):
                    run = p.add_run(t)
                    run.bold = b
                    run.italic = it
                i += 1
                continue

            # Numbered list (simple: "1. ")
            if re.match(r"^\d+\.\s", stripped):
                text = re.sub(r"^\d+\.\s+", "", stripped)
                p = doc.add_paragraph(style="List Number")
                for t, b, it in parse_inline_formatting(text):
                    run = p.add_run(t)
                    run.bold = b
                    run.italic = it
                i += 1
                continue

            # Empty line
            if not stripped:
                doc.add_paragraph()
                i += 1
                continue

            # Normal paragraph (skip internal doc links like [02-system-context](02-system-context.md))
            if stripped.startswith("The next document,") or stripped.startswith("See ") or "](02-" in stripped or "](03-" in stripped:
                # Keep as normal text but clean link
                clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", stripped)
                add_formatted_paragraph(doc, clean)
                i += 1
                continue

            add_formatted_paragraph(doc, stripped)
            i += 1

        # Space between files
        doc.add_paragraph()
        doc.add_paragraph()


def add_title_page(doc):
    """Add a title page at the start."""
    title = doc.add_paragraph()
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    run = title.add_run("Data360 Chat")
    run.bold = True
    run.font.size = Pt(28)
    run.font.name = "Calibri Light"
    doc.add_paragraph()
    sub = doc.add_paragraph()
    sub.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    sub.add_run("Architecture Documentation").font.size = Pt(18)
    doc.add_paragraph()
    doc.add_paragraph()
    meta = doc.add_paragraph()
    meta.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    meta.add_run("Codebase: vercel-ai-chatbot").font.italic = True
    meta.add_run("\nFull-stack conversational AI for development data, documents, and tools.")
    doc.add_paragraph()
    doc.add_paragraph()
    doc.add_page_break()


def add_toc(doc):
    """Add a table of contents (Word will update it when the document is opened)."""
    doc.add_heading("Table of Contents", level=1)
    toc_para = doc.add_paragraph()
    run = toc_para.add_run()
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.set(qn("xml:space"), "preserve")
    instrText.text = ' TOC \\o "1-3" \\h \\z \\u '
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "separate")
    fldChar3 = OxmlElement("w:fldChar")
    fldChar3.set(qn("w:fldCharType"), "end")
    run._element.append(fldChar1)
    run._element.append(instrText)
    run._element.append(fldChar2)
    run._element.append(fldChar3)
    doc.add_paragraph("(Right-click the TOC above and select \"Update Field\" to refresh after opening.)")
    doc.add_paragraph()
    doc.add_page_break()


def main():
    base = Path(__file__).resolve().parent
    files_order = [
        "index.md",
        "overview.md",
        "system-context.md",
        "backend.md",
        "frontend.md",
        "data-persistence.md",
        "authentication.md",
        "ai-streaming.md",
        "integrations.md",
        "deployment-and-operations.md",
        "architectural-decisions.md",
    ]
    md_paths = [base / f for f in files_order]
    out_path = base / "Data360-Chat-Architecture.docx"

    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    add_title_page(doc)
    add_toc(doc)
    convert_md_to_docx(doc, md_paths)
    doc.save(out_path)
    print(f"Saved: {out_path}")


if __name__ == "__main__":
    main()
