import { Conversation, Message } from '../types';

function formatTimestamp(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function sanitizeFilename(title: string): string {
  return (
    (title || 'discussion')
      .toLowerCase()
      .replace(/[^a-z0-9à-öø-ÿ]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'samry-ai-pro-max'
  );
}

/**
 * Exporte la conversation au format Markdown (.md)
 */
export function exportConversationAsMarkdown(conversation: Conversation): boolean {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return false;
  }

  const exportDate = new Date().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [
    `# SAMRY AI PRO MAX – Export de Conversation`,
    ``,
    `- **Titre** : ${conversation.title || 'Discussion sans titre'}`,
    `- **Date d'exportation** : ${exportDate}`,
    `- **Créateur de SAMRY AI PRO MAX** : Oumar Hassane Abdelkerim`,
    `- **Nombre de messages** : ${conversation.messages.length}`,
    `- **Mode** : ${conversation.mode || 'general'}`,
    ``,
    `---`,
    ``,
  ];

  conversation.messages.forEach((msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? 'Utilisateur' : 'SAMRY AI PRO MAX';
    const timeStr = formatTimestamp(msg.timestamp);

    lines.push(`## [${index + 1}] ${roleLabel} (${timeStr})`);
    lines.push(``);

    if (msg.attachment) {
      lines.push(`> **Pièce jointe** : ${msg.attachment.name} (${msg.attachment.type})`);
      lines.push(``);
    }

    if (msg.imagePrompt) {
      lines.push(`> **Image générée** : "${msg.imagePrompt}"`);
      lines.push(``);
    }

    if (msg.text) {
      lines.push(msg.text);
      lines.push(``);
    }

    if (msg.sources && msg.sources.length > 0) {
      lines.push(`### Sources Web vérifiées :`);
      msg.sources.forEach((src) => {
        const site = src.siteName ? ` (${src.siteName})` : '';
        lines.push(`- [${src.title}](${src.url})${site}`);
      });
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  });

  lines.push(`*Exporté depuis SAMRY AI PRO MAX – Créé par Oumar Hassane Abdelkerim.*`);

  const markdownContent = lines.join('\n');
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SAMRY-AI-PRO-MAX-${sanitizeFilename(conversation.title)}-${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Imprime ou enregistre en PDF directement via la feuille d'impression du navigateur (sans window.open)
 */
export function exportConversationAsPdf(conversation: Conversation): boolean {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return false;
  }
  window.print();
  return true;
}
