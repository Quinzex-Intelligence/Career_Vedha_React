import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ContactForm from '../ui/ContactForm';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [showContactForm, setShowContactForm] = useState(false);
    const activeLanguage = localStorage.getItem('preferredLanguage') || 'english';

    const socialLinks = {
        english: {
            facebook: "https://www.facebook.com/p/Career-Vedha-61560606159654/",
            twitter: "https://x.com/careervedha",
            instagram: "https://www.instagram.com/careervedha/",
            youtube: "https://youtube.com/@careervedha"
        },
        telugu: {
            facebook: "https://www.facebook.com/61563861567361/",
            twitter: "https://x.com/careervedha", 
            instagram: "https://www.instagram.com/careervedha/",
            youtube: "https://youtube.com/@careervedha-telugu"
        }
    };

    const links = socialLinks[activeLanguage] || socialLinks.english;

    return (
        <>
            <footer className="main-footer">
                <div className="container">
                    <div className="footer-content">
                        {/* Column 1: Academics Corner */}
                        <div className="footer-column">
                            <h4>Academics Corner</h4>
                            <ul className="footer-links">
                                <li><Link to="/academics">Academics Explorer</Link></li>
                                <li><Link to="/study-materials">Study Materials</Link></li>
                                <li><Link to="/question-papers">Previous Papers</Link></li>
                                <li><Link to="/academic-exams">Competitive Exams</Link></li>
                            </ul>
                        </div>

                        {/* Column 2: Current Affairs */}
                        <div className="footer-column">
                            <h4>Current Affairs</h4>
                            <ul className="footer-links">
                                <li><Link to="/current-affairs?region=INDIA">National (India)</Link></li>
                                <li><Link to="/current-affairs?region=TS">Telangana Updates</Link></li>
                                <li><Link to="/current-affairs?region=AP">Andhra Pradesh</Link></li>
                                <li><Link to="/current-affairs">International & General</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Job Opportunities */}
                        <div className="footer-column">
                            <h4>Job Opportunities</h4>
                            <ul className="footer-links">
                                <li><Link to="/jobs">Latest Notifications</Link></li>
                                <li><Link to="/academic-exams?category=results">Exam Results</Link></li>
                                <li><Link to="/academic-exams?category=admit-cards">Admit Cards</Link></li>
                                <li><Link to="/articles?section=guidance">Career Guidance</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Trending & News */}
                        <div className="footer-column">
                            <h4>Trending & News</h4>
                            <ul className="footer-links">
                                <li><Link to="/news">Daily Educational News</Link></li>
                                <li><Link to="/articles">Most Read Articles</Link></li>
                                <li><Link to="/videos/long">Career Vedha TV</Link></li>
                                <li><Link to="/videos/shorts">Quick Bytes (Shorts)</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="footer-bottom-flex">
                            <div className="footer-brand-mini">
                                <h3>Career Vedha</h3>
                                <p>Trusted Educational Partner</p>
                            </div>

                            <div className="footer-bottom-links">
                                <Link to="/">Home</Link>
                                <span className="separator">|</span>
                                <Link to="/terms-and-conditions">Terms & Conditions</Link>
                                <span className="separator">|</span>
                                <button className="footer-contact-btn" onClick={() => setShowContactForm(true)}>Contact Us</button>
                            </div>
                            
                            <div className="footer-social-premium">
                                <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="social-icon fb" title="Facebook">
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                                <a href={links.twitter} target="_blank" rel="noopener noreferrer" className="social-icon x-twitter" title="X (Twitter)">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="social-icon insta" title="Instagram">
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href={links.youtube} target="_blank" rel="noopener noreferrer" className="social-icon yt" title={`YouTube - ${activeLanguage === 'telugu' ? 'Telugu' : 'English'}`}>
                                    <i className="fab fa-youtube"></i>
                                </a>
                            </div>
                        </div>
                        
                        <div className="copyright-bar mt-4">
                            <p>
                                &copy; {currentYear} Career Vedha. All rights reserved. | Empowering Students Nationwide
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}
        </>
    );
};

export default Footer;
