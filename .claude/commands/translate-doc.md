Translate a Chinese markdown doc to English for this project.

## Rules

- Preserve ALL markdown syntax exactly: headings, code blocks, tables, bold, inline code, links
- Do NOT translate content inside code blocks (``` ``` or ` `)  
- Do NOT translate technical terms, package names, CLI commands, file paths
- Keep the same document structure and heading hierarchy
- The English should sound natural, not like a literal word-for-word translation

## Input

$ARGUMENTS

If $ARGUMENTS is a file path (e.g. `public/docs/zh/backend/csharp-tips.md`):
1. Read that file
2. Determine the output path by replacing `/zh/` with `/en/` in the path
3. Translate the content
4. Write the result to the output path
5. Report: source path, output path, and a one-line summary of what was translated

If $ARGUMENTS is empty:
- Ask the user which file they want to translate
