import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const codeBlockRegex = /```([a-zA-Z0-9_+#.-]*)\r?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.substring(lastIndex, match.index);
      parts.push(renderFormattedBlocks(textChunk, `text-${lastIndex}`));
    }

    const language = match[1] || 'code';
    const code = match[2];
    parts.push(<CodeBlock key={`code-${match.index}`} language={language} code={code} />);

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const textChunk = content.substring(lastIndex);
    parts.push(renderFormattedBlocks(textChunk, `text-${lastIndex}`));
  }

  return <div className="space-y-2.5 leading-relaxed text-[15px] break-words">{parts}</div>;
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur de copie:', err);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono font-medium">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs whitespace-nowrap"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs sm:text-[13px] font-mono text-slate-100 leading-relaxed">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

function renderFormattedBlocks(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      elements.push(<div key={`${keyPrefix}-blank-${i}`} className="h-1" />);
      i++;
      continue;
    }

    // Markdown Table detection
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1].trim())
    ) {
      const headerCells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      i += 2; // Skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowCells = lines[i]
          .trim()
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        bodyRows.push(rowCells);
        i++;
      }

      elements.push(
        <div
          key={`${keyPrefix}-table-${i}`}
          className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {headerCells.map((cell, cIdx) => (
                  <th
                    key={cIdx}
                    className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                  >
                    {formatInlineStyles(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3.5 py-2 text-slate-700 dark:text-slate-300 tabular-nums"
                    >
                      {formatInlineStyles(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr
          key={`${keyPrefix}-hr-${i}`}
          className="my-3 border-slate-200 dark:border-slate-800"
        />
      );
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`${keyPrefix}-h3-${i}`}
          className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1"
        >
          {formatInlineStyles(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`${keyPrefix}-h2-${i}`}
          className="text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800"
        >
          {formatInlineStyles(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`${keyPrefix}-h1-${i}`}
          className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2"
        >
          {formatInlineStyles(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      i++;
      continue;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={`${keyPrefix}-li-${i}`} className="flex items-start gap-2.5 ml-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
          <div className="flex-1 text-slate-800 dark:text-slate-200">
            {formatInlineStyles(trimmed.replace(/^[-*]\s+/, ''))}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`${keyPrefix}-num-${i}`} className="flex items-start gap-2 ml-1.5">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm shrink-0 min-w-5 tabular-nums pt-0.5">
            {numMatch[1]}.
          </span>
          <div className="flex-1 text-slate-800 dark:text-slate-200">
            {formatInlineStyles(numMatch[2])}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Blockquotes (clean hairline border, no thick left bar cliché)
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`${keyPrefix}-quote-${i}`}
          className="border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 px-3.5 py-2.5 my-2 text-slate-700 dark:text-slate-300 italic rounded-xl"
        >
          {formatInlineStyles(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`${keyPrefix}-p-${i}`} className="leading-relaxed text-slate-800 dark:text-slate-200">
        {formatInlineStyles(lines[i])}
      </p>
    );
    i++;
  }

  return (
    <div key={keyPrefix} className="space-y-1.5">
      {elements}
    </div>
  );
}

function formatInlineStyles(str: string): React.ReactNode {
  const codeRegex = /`([^`]+)`/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(...parseBoldItalicAndLinks(str.substring(lastIdx, match.index)));
    }
    parts.push(
      <code
        key={`inline-code-${match.index}`}
        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[13px]"
      >
        {match[1]}
      </code>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < str.length) {
    parts.push(...parseBoldItalicAndLinks(str.substring(lastIdx)));
  }

  return <>{parts}</>;
}

function parseBoldItalicAndLinks(raw: string): React.ReactNode[] {
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(raw.substring(lastIndex, match.index));
    }

    if (match[1]) {
      const label = match[2];
      const url = match[3];
      nodes.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 font-medium"
        >
          {label}
        </a>
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-bold text-slate-900 dark:text-white">
          {match[5]}
        </strong>
      );
    } else if (match[6]) {
      nodes.push(
        <em key={`italic-${match.index}`} className="italic">
          {match[7]}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    nodes.push(raw.substring(lastIndex));
  }

  return nodes;
}
