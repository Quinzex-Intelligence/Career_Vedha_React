import React from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, User } from 'lucide-react';

const MobileTopBar = () => {
  return (
    <div className="mobile-top-bar">
      <NavLink to="/" className="mobile-logo">
        <img 
          src="/Career Vedha logo.png" 
          alt="Career Vedha" 
          style={{ height: '70px', width: 'auto' }}
        />
      </NavLink>

      <div className="top-bar-actions">
        {/* Removed notifications for public users as requested */}
        <NavLink to="/dashboard" className="profile-btn">
          <User size={20} />
        </NavLink>
      </div>

    </div>
  );
};

export default MobileTopBar;
