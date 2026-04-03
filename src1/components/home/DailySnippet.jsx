import React, { useState, useEffect } from 'react';
import { newsService } from '../../services';
import './DailySnippet.css';

const DailySnippet = ({ activeLanguage }) => {
    const [snippet, setSnippet] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSnippet = async () => {
            setLoading(true);
            try {
                // Fetch trending or latest current affairs to use as a snippet
                const results = await newsService.getTrendingArticles({ section: 'current-affairs', limit: 3 });
                const articles = results.results || [];
                if (articles.length > 0) {
                    // Pick a random one for "Daily" feel
                    const randomIdx = Math.floor(Math.random() * articles.length);
                    setSnippet(articles[randomIdx]);
                }
            } catch (error) {
                console.error("Error fetching snippet:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSnippet();
    }, [activeLanguage]);

    if (loading || !snippet) return null;

    return (
        <div className="daily-snippet-ribbon">
            <div className="container">
                <div className="snippet-content">
                    <div className="snippet-badge">
                        <i className="fas fa-bolt"></i> Quick Fact
                    </div>
                    <div className="snippet-text">
                        <strong>Did you know?</strong> {snippet.headline || snippet.title}
                    </div>
                    <a href={`/article/${snippet.section}/${snippet.slug}`} className="snippet-link">
                        Read More <i className="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DailySnippet;
