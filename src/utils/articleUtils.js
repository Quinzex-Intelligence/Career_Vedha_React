/**
 * Utility function to check if an article should be visible to the public
 * based on its published_at timestamp
 */

export const isArticlePublished = (article) => {
    if (!article) return false;
    
    // If status is present and NOT PUBLISHED, don't show it.
    // In public feeds, the status field might be omitted entirely.
    if (article.status && article.status !== 'PUBLISHED') return false;
    
    // If no published_at date, it's published immediately
    if (!article.published_at) return true;
    
    // Check if the published_at time has passed (with 5 min buffer for clock skew)
    let publishDate = new Date(article.published_at);
    
    // Handle SQL-like timestamps (YYYY-MM-DD HH:MM:SS) which might fail strict parsing
    if (isNaN(publishDate.getTime()) && typeof article.published_at === 'string') {
        publishDate = new Date(article.published_at.replace(' ', 'T'));
    }

    const now = new Date();
    // Allow articles published up to 5 minutes in the future
    const adjustedNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // If still invalid, assume it's valid to likely show it (or hide it? hiding safely)
    if (isNaN(publishDate.getTime())) {
        console.warn('[ArticleUtils] Invalid date format for:', article.title, article.published_at);
        return false;
    }

    return publishDate <= adjustedNow;
};

/**
 * Filter an array of articles to only show published ones
 */
export const filterPublishedArticles = (articles) => {
    if (!Array.isArray(articles)) return [];
    return articles.filter(isArticlePublished);
};

/**
 * Filter an array of articles based on available translations.
 * Required because the backend may return Top Stories that omit the requested language.
 */
export const filterByLanguage = (articles, langCode) => {
    if (!Array.isArray(articles)) return [];
    
    return articles.filter(article => {
        // Fallback for legacy articles without explicit translations
        if (!article.translations || article.translations.length === 0) {
            return true;
        }
        
        // Return true only if a translation exists for the requested language
        return article.translations.some(t => t.language === langCode);
    });
};

/**
 * Check if an article is scheduled for future publication
 */
export const isArticleScheduled = (article) => {
    if (!article) return false;
    if (article.status !== 'PUBLISHED') return false;
    if (!article.published_at) return false;
    
    const publishDate = new Date(article.published_at);
    const now = new Date();
    
    return publishDate > now;
};

/**
 * Extract the best available image URL from a content object (Article, Current Affair, etc.)
 */
export const getBestImageUrl = (item) => {
    if (!item) return null;

    // 1. Django Style: Media Array
    if (item.media && item.media.length > 0) {
        // Prefer position 0 or first available
        const sorted = [...item.media].sort((a, b) => (a.position || 0) - (b.position || 0));
        const firstMedia = sorted[0]?.media_details || sorted[0];
        if (firstMedia?.url) return firstMedia.url;
    }

    // 2. Django Style: De-coupled Media Fields
    if (item.main_media?.url) return item.main_media.url;
    if (item.banner_media?.url) return item.banner_media.url;

    // 3. Spring Boot Style: Direct URL fields
    if (item.fileUrl) return item.fileUrl;
    if (item.imageUrl) return item.imageUrl;
    if (item.image_url) return item.image_url;
    if (item.image) return item.image;

    // 4. Fallbacks (OG Tags or Featured Media)
    if (item.featured_media?.url) return item.featured_media.url;
    if (item.og?.image || item.og?.image_url) return item.og.image || item.og.image_url;
    if (item.og_image_url) return item.og_image_url;

    return null;
};
