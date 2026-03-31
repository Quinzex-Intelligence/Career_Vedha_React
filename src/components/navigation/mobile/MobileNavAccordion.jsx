import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MobileNavAccordion = ({ item, level = 0, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Normalize children items if it's the root block vs nested block
    const rawChildren = item.dropdownItems || item.children || [];
    const hasChildren = rawChildren.length > 0 || item.hasDropdown;
    
    return (
        <div 
            className={`nav-tree-node level-${level}`} 
            style={{ 
                marginBottom: '8px',
                backgroundColor: isOpen && level === 0 ? 'var(--gray-50)' : 'transparent',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
            }}
        >
            {/* The Header Row: Text navigates, Icon expands */}
            <div 
                style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: level === 0 ? '12px 16px' : '10px 16px',
                    paddingLeft: `${Math.max(16, level * 24)}px`,
                }}
            >
                {/* The clickable link portion */}
                <NavLink 
                    to={item.path || '#'} 
                    className={level === 0 ? "drawer-link" : ""}
                    onClick={onClose}
                    style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        color: level === 0 ? 'var(--gray-900)' : 'var(--gray-700)',
                        textDecoration: 'none',
                        fontWeight: level === 0 ? '700' : '500',
                        fontSize: level === 0 ? '15px' : '14px',
                        padding: '0',
                        margin: '0' // clean up implicit margins
                    }}
                >
                    {item.icon && level === 0 && <i className={item.icon} style={{ width: '24px', textAlign: 'center', color: 'var(--primary-color)' }}></i>}
                    <span>{item.name}</span>
                </NavLink>

                {/* The explicit dropdown toggler */}
                {hasChildren && (
                    <div 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        style={{ 
                            padding: '8px', 
                            cursor: 'pointer',
                            color: isOpen ? 'var(--primary-color)' : 'var(--gray-500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
                            borderRadius: '50%',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                )}
            </div>
            
            {/* The dropdown children */}
            {hasChildren && isOpen && (
                <div 
                    className="nav-tree-children" 
                    style={{ 
                        paddingTop: '4px',
                        paddingBottom: '12px',
                    }}
                >
                    {rawChildren.map((child, idx) => {
                        const childPath = item.buildUrl 
                            ? item.buildUrl(level === 0 ? child : item._parentCat, level === 0 ? null : child)
                            : child.path || '#';
                            
                        const childProps = {
                            ...child,
                            path: childPath,
                            _parentCat: level === 0 ? child : item._parentCat,
                            buildUrl: item.buildUrl
                        };
                        
                        return (
                            <MobileNavAccordion key={idx} item={childProps} level={level + 1} onClose={onClose} />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MobileNavAccordion;
