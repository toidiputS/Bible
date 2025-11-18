import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Reader } from './components/Reader';
import { SECTIONS } from './constants';

const App: React.FC = () => {
  const [currentSectionId, setCurrentSectionId] = useState<string>(SECTIONS[0].id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Find current section index
  const currentIndex = SECTIONS.findIndex(s => s.id === currentSectionId);
  const currentSection = SECTIONS[currentIndex];
  const isLast = currentIndex === SECTIONS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentSectionId(SECTIONS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentSectionId(SECTIONS[currentIndex - 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-amber-500/30 selection:text-amber-200 font-body">
      <Navigation 
        currentSectionId={currentSectionId} 
        onSectionChange={setCurrentSectionId}
        isOpen={isMenuOpen}
        toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
      />
      
      <Reader 
        section={currentSection} 
        onNext={handleNext}
        isLast={isLast}
      />
    </div>
  );
};

export default App;