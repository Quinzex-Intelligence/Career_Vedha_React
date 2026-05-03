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

const StudyMaterialsPage = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeLanguage } = useLanguage();

    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const LIMIT = 12;

    const fetchMaterials = useCallback(async (cursorVal = null) => {
        try {
            if (cursorVal) {
                setIsFetchingMore(true);
            } else {
                setIsLoading(true);
            }

            const data = await questionPaperService.getPapersByCategory('MATERIAL', cursorVal, LIMIT);
            const results = Array.isArray(data) ? data : [];

            if (cursorVal) {
                setMaterials(prev => [...prev, ...results]);
            } else {
                setMaterials(results);
            }

            // If we got a full page, there might be more
            setHasMore(results.length >= LIMIT);

            // Use the last item's creationDate as the cursor for next page
            if (results.length > 0) {
                const lastItem = results[results.length - 1];
                setCursor(lastItem.creationDate || lastItem.created_at || null);
            }
        } catch (error) {
            console.error('Error fetching study materials:', error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const handleLoadMore = () => {
        if (cursor && !isFetchingMore) {
            fetchMaterials(cursor);
        }
    };

    return (
        <>
            <SEO 
                title="Study Materials | Career Vedha"
                description="Expert curated lessons, notes, and study guides for all academic and competitive exams."
                keywords="study materials, notes, lessons, exam preparation, career vedha"
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
                                <h1 className="premium-title">Study Materials</h1>
                                <p className="premium-subtitle">Expert curated lessons and notes</p>
                            </div>
                        </div>
                    </div>

                    {isLoading && materials.length === 0 ? (
                        <div className="premium-loader-container">
                            <div className="premium-spinner"></div>
                            <p>Loading materials...</p>
                        </div>
                    ) : materials.length > 0 ? (
                        <>
                            <div className="papers-grid-large">
                                {materials.map((material) => {
                                    const fileUrl = material.presignedUrl || material.file_url;
                                    return (
                                        <Link
                                            to={`/paper-viewer?url=${encodeURIComponent(fileUrl)}&title=${encodeURIComponent(material.title)}`}
                                            key={material.id}
                                            className="paper-card-large"
                                        >
                                            <div className="paper-icon material-icon">
                                                <i className="fas fa-book"></i>
                                            </div>
                                            <div className="paper-card-content">
                                                <span className="paper-title">{material.title}</span>
                                                {material.description && (
                                                    <span className="paper-description">{material.description}</span>
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
                            <p>No study materials available for this selection.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default StudyMaterialsPage;
