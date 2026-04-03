import React from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, User } from 'lucide-react';

const MobileTopBar = () => {
  return (
    <div className="mobile-top-bar">
      <NavLink to="/" className="mobile-logo">
        <img 
          src="/Career Vedha logo1.png" 
          alt="Career Vedha" 
          style={{ width: '150px', height: 'auto', objectFit: 'contain', margin: '-10px 0' }}
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
