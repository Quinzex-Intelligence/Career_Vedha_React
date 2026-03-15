import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { academicsService } from '../../../services/academicsService';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import TopStoriesHero from '../../../components/home/TopStoriesHero';
import { useHomeContent } from '../../../hooks/useHomeContent';
import ContentHubWidget from '../../../components/ui/ContentHubWidget';
import './Academics.css';

const AcademicsHome = () => {
    const [selectedBoard, setSelectedBoard] = useState('AP');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [levelBlocks, setLevelBlocks] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });

    const { data: homeData, isLoading: homeLoading } = useHomeContent(activeLanguage, 10);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await academicsService.getLevelBlocks(selectedBoard);
                if (isMounted) {
                    setLevelBlocks(data);
                }
            } catch (error) {
                console.error("Failed to fetch level blocks", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [selectedBoard]);

    const boards = [
        { id: 'AP', name: 'Andhra Pradesh', icon: '🏛️' },
        { id: 'TS', name: 'Telangana', icon: '🏛️' },
        { id: 'CBSE', name: 'CBSE', icon: '🏫' },
    ];

    return (
        <div className="academics-home-page">
            <TopBar />
            <Header onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} activeLanguage={activeLanguage} onLanguageChange={(lang) => {
                setActiveLanguage(lang);
                localStorage.setItem('preferredLanguage', lang);
            }} />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <TopStoriesHero 
                topStories={homeData?.top_stories?.filter(s => s.section === 'academics') || homeData?.latest?.results?.filter(s => s.section === 'academics')?.slice(0, 5) || []}
                loading={homeLoading}
                activeLanguage={activeLanguage}
                title="Academic Top Stories"
                viewAllLink="/academics"
                sidebarBlocks={[
                    {
                        title: "Next in Academics",
                        items: homeData?.latest?.results?.filter(s => s.section === 'academics')?.slice(5, 8) || [],
                        viewAllLink: "/academics"
                    },
                    {
                        title: "Most Popular",
                        items: homeData?.trending?.filter(s => s.section === 'academics')?.slice(0, 3) || homeData?.trending?.slice(0, 3) || [],
                        viewAllLink: "/articles"
                    }
                ]}
            />

            <div className="academics-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Academic Excellence</h1>
                        <p>Comprehensive study materials, previous papers, and chapter-wise analysis for your success.</p>
                        
                        <div className="board-selector">
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    className={`board-btn ${selectedBoard === board.id ? 'active' : ''}`}
                                    onClick={() => setSelectedBoard(board.id)}
                                >
                                    <span className="board-icon">{board.icon}</span>
                                    <span className="board-name">{board.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="container main-content">
                {isLoading ? (
                    <div className="loading-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton-block"></div>
                        ))}
                    </div>
                ) : (
                    <div className="level-blocks-grid">
                        {levelBlocks?.map((block, index) => (
                            <React.Fragment key={block.level.id}>
                                <section className="level-section">
                                    <div className="section-header">
                                        <div className="header-title">
                                            <div className="marker"></div>
                                            <h2>{block.level.name}</h2>
                                        </div>
                                        <Link to={`/academics/level/${block.level.slug}`} className="view-all">
                                            View All Subjects <i className="fas fa-arrow-right"></i>
                                        </Link>
                                    </div>

                                    <div className="subjects-grid">
                                        {block.subjects.map(subject => (
                                            <Link 
                                                key={subject.id} 
                                                to={`/academics/subject/${subject.slug}`} 
                                                className="subject-card-premium"
                                            >
                                                <div className="card-icon">
                                                    {subject.icon ? (
                                                        <img src={subject.icon} alt={subject.name} />
                                                    ) : (
                                                        <i className="fas fa-book-open"></i>
                                                    )}
                                                </div>
                                                <div className="card-content">
                                                    <h3>{subject.name}</h3>
                                                    <span className="material-count">
                                                        {subject.material_count || 0} Materials
                                                    </span>
                                                </div>
                                                <div className="hover-indicator">
                                                    <i className="fas fa-chevron-right"></i>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>

                                {/* Content Split: Contextual Hub between blocks */}
                                {index < levelBlocks.length - 1 && (
                                    <div className="academics-content-split py-4">
                                        <ContentHubWidget 
                                            searchQuery={block.level.name} 
                                            title={`Updates for ${block.level.name}`}
                                            minimal={true}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default AcademicsHome;
