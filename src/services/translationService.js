/**
 * Dynamic Multi-Language Machine Translation Service for School ERP.
 * Translates ANY arbitrary text dynamically between English, Marathi (mr), and Hindi (hi).
 */

const translationCache = new Map();

/**
 * Translates a single text string into the target language (mr / hi).
 * Uses MyMemory API with automatic fallback to Google Translate web service.
 */
export const translateText = async (text, targetLang) => {
  if (!text || typeof text !== "string" || !text.trim()) return "";
  if (targetLang === "en") return text;

  const cacheKey = `${targetLang}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const encodedText = encodeURIComponent(text.trim());

  // Attempt 1: MyMemory API
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`);
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (err) {
    console.warn("MyMemory API failed, attempting fallback API...", err);
  }

  // Attempt 2: Google Translate Client Endpoint
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodedText}`
    );
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item) => item[0]).join("");
      if (translated) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    console.warn("Google Translate fallback API failed:", err);
  }

  return text; // Graceful fallback
};

/**
 * Translates both title and content payload dynamically.
 */
export const translateNotice = async (title, content, targetLang) => {
  if (targetLang === "en") return { title: title || "", content: content || "" };

  const [translatedTitle, translatedContent] = await Promise.all([
    translateText(title || "", targetLang),
    translateText(content || "", targetLang),
  ]);

  return {
    title: translatedTitle || title,
    content: translatedContent || content,
  };
};

const translationService = {
  translateText,
  translateNotice,
};

export default translationService;
