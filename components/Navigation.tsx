import React from 'react';
import { SECTIONS } from '../constants';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  currentSectionId: string;
  onSectionChange: (id: string) => void;
  isOpen: boolean;
  toggleMenu: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentSectionId, 
  onSectionChange,
  isOpen,
  toggleMenu
}) => {
  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleMenu}
        className="fixed top-6 right-6 z-50 p-2 text-amber-500 bg-black/50 backdrop-blur-md rounded-full border border-amber-500/20 hover:bg-amber-900/20 transition-colors lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <nav className={`
        fixed top-0 left-0 h-full w-80 bg-neutral-950 border-r border-neutral-800 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-8">
          <div className="mb-12 pt-4">
            <div className="w-12 h-12 border-2 border-amber-500/50 rotate-45 mb-6 flex items-center justify-center">
              <div className="w-6 h-6 border border-amber-500/30" />
            </div>
            <h1 className="font-heading text-2xl text-white tracking-widest">THE_BIBLE<br/><span className="text-amber-500">.exe</span></h1>
            <p className="text-neutral-500 text-xs mt-2 tracking-widest uppercase">Live Testament</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id);
                  if (window.innerWidth < 1024) toggleMenu();
                }}
                className={`
                  w-full text-left py-3 px-4 rounded-md transition-all duration-200 group relative overflow-hidden
                  ${currentSectionId === section.id 
                    ? 'bg-amber-900/20 text-amber-400' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}
                `}
              >
                <div className="flex items-baseline justify-between relative z-10">
                  <span className="font-heading text-sm tracking-wider">
                    {section.indexLabel || '00'}
                  </span>
                  <span className={`text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${currentSectionId === section.id ? 'opacity-100' : ''}`}>
                    {section.label || 'FILE'}
                  </span>
                </div>
                <div className="mt-1 font-body text-lg relative z-10 truncate">
                  {section.title}
                </div>
                
                {/* Subtle highlight bar */}
                {currentSectionId === section.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-8 border-t border-neutral-900 text-center">
            <p className="text-neutral-600 text-xs font-heading tracking-widest">
              EXECUTING // GENESIS
            </p>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm"
          onClick={toggleMenu}
        />
      )}
    </>
  );
};