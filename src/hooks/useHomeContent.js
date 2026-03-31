import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services';
import { filterPublishedArticles, filterByLanguage } from '../utils/articleUtils';

export const homeKeys = {
    all: ['home-content'],
    content: (lang) => [...homeKeys.all, lang],
};

export const useHomeContent = (lang = 'english', limit = 20, offset = 0) => {
    const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

    return useQuery({
        queryKey: [...homeKeys.content(langCode), limit, offset],
        queryFn: async () => {
            const data = await newsService.getHomeContent(langCode, limit, offset);
            
            // Apply filtering logic here so components get clean data
            return {
                hero: filterByLanguage(filterPublishedArticles(data.hero || []), langCode),
                breaking: filterByLanguage(filterPublishedArticles(data.breaking || []), langCode),
                top_stories: filterByLanguage(filterPublishedArticles(data.top_stories || []), langCode),
                featured: filterByLanguage(filterPublishedArticles(data.featured || []), langCode),
                trending: filterByLanguage(filterPublishedArticles(data.trending || []), langCode),
                must_read: filterByLanguage(filterPublishedArticles(data.must_read || []), langCode),
                latest: {
                    ...data.latest,
                    results: filterByLanguage(filterPublishedArticles(data.latest?.results || []), langCode)
                }
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCategoryBlocks = (section, lang = 'english') => {
    const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

    return useQuery({
        queryKey: ['category-blocks', section, langCode],
        queryFn: async () => {
            const data = await newsService.getCategoryBlocks(section, langCode);
            
            // Filter scheduled articles from each block
            return (data.blocks || []).map(block => ({
                ...block,
                results: filterByLanguage(filterPublishedArticles(block.results || []), langCode)
            })).filter(block => block.results.length > 0); // Remove empty blocks
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useTrendingArticles = (limit = 5, lang = 'english') => {
    const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

    return useQuery({
        queryKey: ['trending-articles', langCode, limit],
        queryFn: async () => {
            const data = await newsService.getTrendingArticles({ limit: limit * 2, lang: langCode });
            return filterByLanguage(data.results || [], langCode).slice(0, limit);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
