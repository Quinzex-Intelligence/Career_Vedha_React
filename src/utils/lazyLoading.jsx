import { lazy } from 'react';

/**
 * Wraps a dynamic import with a retry mechanism that forces a page reload
 * if the chunk fails to load due to a version mismatch in production.
 * 
 * @param {Function} componentImport The dynamic import function e.g. () => import('./MyComponent')
 * @returns {React.LazyExoticComponent}
 */
export const lazyWithRetry = (componentImport) =>
    lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            const component = await componentImport();
            
            // If the import succeeds, clear the flag so future updates during this session can also trigger a refresh
            if (pageHasAlreadyBeenForceRefreshed) {
                sessionStorage.removeItem('page-has-been-force-refreshed');
            }
            
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // Determine if this is likely a stale chunk error
                const isChunkLoadError = 
                    error.name === 'ChunkLoadError' || 
                    (error.message && error.message.includes('Failed to fetch')) ||
                    (error.message && error.message.includes('dynamically imported module')) ||
                    (error.message && error.message.includes('text/html'));

                if (isChunkLoadError) {
                    console.warn("[Vite] Dynamic import failed due to version mismatch. Refreshing page...");
                    // Set flag to prevent infinite reload loop
                    sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                    
                    // Force refresh to bypass cache and get the latest index.html
                    window.location.reload(true);
                    
                    // Return a never-resolving promise while the page reloads
                    return new Promise(() => {});
                }
            }
            
            // If we already refreshed or it's a different error, throw it so ErrorBoundary can catch it
            console.error("[Vite] Dynamic import failed permanently.", error);
            throw error;
        }
    });

/**
 * Clears the retry flag. Can be called on explicit app reset or auth changes.
 */
export const clearLazyRetryFlag = () => {
    sessionStorage.removeItem('page-has-been-force-refreshed');
};
