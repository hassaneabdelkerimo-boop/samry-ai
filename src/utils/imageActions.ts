// SAMRY AI PRO MAX - Actions sur les images (Téléchargement & Partage)

export async function downloadImage(imageUrl: string, prompt?: string): Promise<boolean> {
  try {
    const cleanPrompt = (prompt || 'SAMRY_AI_PRO_MAX')
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    const filename = `SAMRY_AI_${cleanPrompt}_${Date.now()}`;

    if (imageUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    return false;
  }
}

export async function shareImage(
  imageUrl: string,
  prompt?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const shareTitle = 'SAMRY AI PRO MAX - Création IA';
  const shareText = `Image créée avec SAMRY AI PRO MAX (par Oumar Hassane Abdelkerim) : "${prompt || 'Création'}"`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: imageUrl.startsWith('data:') ? undefined : imageUrl,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
    }
  }

  try {
    const textToCopy = imageUrl.startsWith('data:') ? shareText : imageUrl;
    await navigator.clipboard.writeText(textToCopy);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'clipboard' };
  }
}
