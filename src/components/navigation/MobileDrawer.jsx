import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, GraduationCap, FileText, User, HelpCircle, Info, LayoutDashboard, Users, Brain, Shield, Key, Bell, Briefcase, Tags, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { newsService } from '../../services';
import { getTranslations } from '../../utils/translations';
import { getUserContext } from '../../services/api';
import { checkAccess, MODULES } from '../../config/accessControl.config';

const MobileDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const userContext = getUserContext();
  const { role: userRole, isAuthenticated } = userContext;
  const activeLanguage = localStorage.getItem('preferredLanguage') || 'english';
  const t = getTranslations(activeLanguage);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [navSections, setNavSections] = useState([]);

  // Fetch sections for mobile nav
  React.useEffect(() => {
    if (isOpen) {
      newsService.getSections().then(setNavSections).catch(console.error);
    }
  }, [isOpen]);

  // Helper for admin navigation that also closes the drawer
  const handleAdminNav = (path) => {
    navigate(path);
    onClose();
  };

  const isAdmin = userRole && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'EDITOR' || userRole === 'CONTRIBUTOR' || userRole === 'PUBLISHER');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="drawer-overlay"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="drawer-content"
          >
            <div className="drawer-header">
              <div className="drawer-logo">
                <img 
                  src="/Career Vedha logo.png" 
                  alt="Career Vedha" 
                  style={{ height: '60px', width: 'auto', marginRight: '15px' }}
                />
                <span>CAREER VEDHA</span>
              </div>
              <button onClick={onClose} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="drawer-nav">
              {/* Home */}
              <NavLink to="/" className="drawer-link" onClick={onClose}>
                <LayoutDashboard size={20} />
                <span>{t.navHome}</span>
              </NavLink>

              {/* Dynamic Categories */}
              {navSections.length > 0 ? (
                navSections.map(section => (
                  <NavLink 
                    key={section.id} 
                    to={section.slug === 'exams' ? '/academic-exams' : `/articles?section=${section.slug}`} 
                    className="drawer-link" 
                    onClick={onClose}
                  >
                    <FileText size={20} />
                    <span>{section.name}</span>
                  </NavLink>
                ))
              ) : (
                <>
                  <NavLink to="/academic-exams" className="drawer-link" onClick={onClose}>
                    <FileText size={20} />
                    <span>Exams</span>
                  </NavLink>
                </>
              )}

              <NavLink to="/about" className="drawer-link" onClick={onClose}>
                <Info size={20} />
                <span>{t.navAbout || "About Us"}</span>
              </NavLink>
              <NavLink to="/contact" className="drawer-link" onClick={onClose}>
                <User size={20} />
                <span>{t.navContact || "Contact Us"}</span>
              </NavLink>

              {/* Admin Section */}
              {isAuthenticated && isAdmin && (
                <>
                  <div className="divider" />
                  <div 
                    className="drawer-link admin-toggle" 
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <LayoutDashboard size={20} color="var(--primary-yellow)" />
                      <span style={{ fontWeight: '700', color: 'var(--gray-900)' }}>ADMIN CONSOLE</span>
                    </div>
                    {isAdminOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>

                  {isAdminOpen && (
                    <div className="admin-submenu" style={{ paddingLeft: '12px' }}>
                      <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=overview')}>
                        <LayoutDashboard size={18} />
                        <span>Overview</span>
                      </button>
                      
                      {checkAccess(userRole, MODULES.USER_MANAGEMENT) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=users')}>
                          <Users size={18} />
                          <span>Users</span>
                        </button>
                      )}

                      {checkAccess(userRole, MODULES.QUIZ_MANAGER) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=quizzes')}>
                          <Brain size={18} />
                          <span>Quizzes</span>
                        </button>
                      )}

                      {checkAccess(userRole, MODULES.ROLE_CONTROL) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=roles')}>
                          <Shield size={18} />
                          <span>Roles</span>
                        </button>
                      )}

                      {checkAccess(userRole, MODULES.PERMISSIONS) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=permissions')}>
                          <Key size={18} />
                          <span>Permissions</span>
                        </button>
                      )}

                      {userRole !== 'CONTRIBUTOR' && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=notifications')}>
                          <Bell size={18} />
                          <span>Notifications</span>
                        </button>
                      )}

                      <div className="divider" style={{ opacity: 0.3 }} />

                      {checkAccess(userRole, MODULES.ARTICLE_MANAGEMENT) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=articles')}>
                          <FileText size={18} />
                          <span>Articles CMS</span>
                        </button>
                      )}

                      {/* Hide Jobs CMS for Contributors explicitly */}
                      {userRole !== 'CONTRIBUTOR' && checkAccess(userRole, MODULES.JOB_MANAGEMENT) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/cms/jobs')}>
                          <Briefcase size={18} />
                          <span>Jobs CMS</span>
                        </button>
                      )}

                      <button className="drawer-link" onClick={() => handleAdminNav('/cms/taxonomy')}>
                        <Tags size={18} />
                        <span>Taxonomy</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="divider" />
              <NavLink to="/help" className="drawer-link" onClick={onClose}>
                <HelpCircle size={20} />
                <span>Help & Support</span>
              </NavLink>
            </div>

            <div className="drawer-footer">
              <p>Version 1.1.0 (Admin Enabled)</p>
              <p>&copy; 2026 Career Vedha</p>
            </div>
          </motion.div>
        </>
      )}

    </AnimatePresence>
  );
};

export default MobileDrawer;
