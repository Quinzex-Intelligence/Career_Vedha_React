import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { questionPaperService } from '../services';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import '../styles/contact-papers.css';
import './Articles.css';

const QuestionPapersPage = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeLanguage } = useLanguage();

    const [papers, setPapers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const LIMIT = 12;

    const fetchPapers = useCallback(async (cursorVal = null) => {
        try {
            if (cursorVal) {
                setIsFetchingMore(true);
            } else {
                setIsLoading(true);
            }

            const data = await questionPaperService.getPapersByCategory('QUESTIONPAPER', cursorVal, LIMIT);
            const results = Array.isArray(data) ? data : [];

            if (cursorVal) {
                setPapers(prev => [...prev, ...results]);
            } else {
                setPapers(results);
            }

            // If we got a full page, there might be more
            setHasMore(results.length >= LIMIT);

            // Use the last item's creationDate as the cursor for next page
            if (results.length > 0) {
                const lastItem = results[results.length - 1];
                setCursor(lastItem.creationDate || lastItem.created_at || null);
            }
        } catch (error) {
            console.error('Error fetching question papers:', error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchPapers();
    }, [fetchPapers]);

    const handleLoadMore = () => {
        if (cursor && !isFetchingMore) {
            fetchPapers(cursor);
        }
    };

    return (
        <>
            <SEO 
                title="Question Papers | Career Vedha"
                description="Download previous year question papers, model papers, and practice sets for various exams."
                keywords="question papers, previous papers, model papers, exam prep, career vedha"
            />
            <Header 
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
            />
            <PrimaryNav />
            
            <div className="papers-page">

                <div className="container">
                    <div className="papers-controls">
                        <div className="section-header">
                            <div>
                                <h1 className="premium-title">Question Papers</h1>
                                <p className="premium-subtitle">Previous year papers and practice sets</p>
                            </div>
                        </div>
                    </div>

                    {isLoading && papers.length === 0 ? (
                        <div className="premium-loader-container">
                            <div className="premium-spinner"></div>
                            <p>Loading papers...</p>
                        </div>
                    ) : papers.length > 0 ? (
                        <>
                            <div className="papers-grid-large">
                                {papers.map((paper) => {
                                    const fileUrl = paper.presignedUrl || paper.file_url;
                                    return (
                                        <Link
                                            to={`/paper-viewer?url=${encodeURIComponent(fileUrl)}&title=${encodeURIComponent(paper.title)}`}
                                            key={paper.id}
                                            className="paper-card-large"
                                        >
                                            <div className="paper-icon">
                                                <i className="fas fa-file-pdf"></i>
                                            </div>
                                            <div className="paper-card-content">
                                                <span className="paper-title">{paper.title}</span>
                                                {paper.description && (
                                                    <span className="paper-description">{paper.description}</span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <div className="load-more-container">
                                    <button
                                        onClick={handleLoadMore}
                                        className="load-more-btn"
                                        disabled={isFetchingMore}
                                    >
                                        {isFetchingMore ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Loading...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-arrow-down"></i> Load More
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="papers-empty">
                            <i className="fas fa-folder-open"></i>
                            <p>No question papers available for this selection.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default QuestionPapersPage;
