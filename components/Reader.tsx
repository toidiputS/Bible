import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Section, ContentBlock } from '../types';
import { ArrowRight, Sparkles, Music, Highlighter, Trash2, Play, Pause, AlertCircle } from 'lucide-react';

interface ReaderProps {
  section: Section;
  onNext: () => void;
  isLast: boolean;
}

interface Highlight {
  start: number;
  end: number;
}

interface HighlightsState {
  [blockIndex: number]: Highlight[];
}

// --- Custom Audio Player Component ---
const CustomAudioPlayer: React.FC<{ src: string; title: string }> = ({ src, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  // Reset state when source changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setError(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.error("Playback failed:", e);
            setIsPlaying(false);
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (!isNaN(total) && total > 0) {
        setCurrentTime(current);
        setDuration(total);
        setProgress((current / total) * 100);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current && duration > 0) {
      const time = (value / 100) * duration;
      audioRef.current.currentTime = time;
      setProgress(value);
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="mb-16 p-4 bg-red-900/10 border border-red-900/30 rounded-lg flex items-center gap-3 text-red-400 text-xs font-mono animate-in fade-in slide-in-from-top-2">
        <AlertCircle size={16} />
        <span>ERROR: CONNECTION INTERRUPTED. FILE NOT FOUND ({src})</span>
      </div>
    );
  }

  return (
    <div className={`
      mb-16 p-6 bg-neutral-900/50 border rounded-lg backdrop-blur-sm group transition-all duration-500
      ${isPlaying ? 'border-amber-500/40 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]' : 'border-neutral-800 hover:border-amber-500/20'}
    `}>
      <div className="flex items-center gap-3 mb-6 text-amber-500/80">
        <Music size={16} className={isPlaying ? "animate-pulse" : ""} />
        <span className="text-xs font-heading tracking-widest uppercase">Audio Log // {title}</span>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={togglePlay}
          className={`
            w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full 
            transition-all duration-300 hover:scale-105 focus:outline-none
            ${isPlaying 
              ? 'bg-amber-500 text-neutral-900 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
              : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20'}
          `}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 space-y-2">
          <div className="relative h-1.5 bg-neutral-800 rounded-full cursor-pointer w-full group/bar">
            {/* Interactive Range Input */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Visual Progress Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all duration-100 pointer-events-none"
              style={{ width: `${progress}%` }}
            />
            {/* Hover/Drag Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none duration-200"
              style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] font-mono text-neutral-500 tracking-wide">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
        preload="metadata"
      />
    </div>
  );
};

// --- Helper: Text Offset Calculation ---
const getBlockOffset = (root: Node, target: Node, offset: number): number => {
  let currentOffset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  
  let node = walker.nextNode();
  while (node) {
    if (node === target) {
      return currentOffset + offset;
    }
    currentOffset += node.textContent?.length || 0;
    node = walker.nextNode();
  }
  return -1;
};

// --- Helper: Highlighted Text Renderer ---
const HighlightedText: React.FC<{ text: string; highlights?: Highlight[] }> = ({ text, highlights }) => {
  if (!highlights || highlights.length === 0) return <>{text}</>;

  // Sort and merge overlapping highlights
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged: Highlight[] = [];
  
  if (sorted.length > 0) {
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (current.end >= sorted[i].start) {
        current.end = Math.max(current.end, sorted[i].end);
      } else {
        merged.push(current);
        current = sorted[i];
      }
    }
    merged.push(current);
  }

  const parts = [];
  let lastIndex = 0;

  merged.forEach((h, i) => {
    const start = Math.max(0, Math.min(h.start, text.length));
    const end = Math.max(0, Math.min(h.end, text.length));

    if (start > lastIndex) {
      parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, start)}</span>);
    }
    parts.push(
      <span key={`highlight-${i}`} className="bg-amber-500/30 text-amber-100 rounded-[2px] px-0.5 shadow-sm box-decoration-clone">
        {text.slice(start, end)}
      </span>
    );
    lastIndex = end;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
};

// --- Main Reader Component ---
export const Reader: React.FC<ReaderProps> = ({ section, onNext, isLast }) => {
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<HighlightsState>({});
  const [toolbar, setToolbar] = useState<{ top: number; left: number; show: boolean } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`highlights-${section.id}`);
    if (saved) {
      try {
        setHighlights(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load highlights", e);
      }
    } else {
      setHighlights({});
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [section.id]);

  const saveHighlights = (newHighlights: HighlightsState) => {
    setHighlights(newHighlights);
    localStorage.setItem(`highlights-${section.id}`, JSON.stringify(newHighlights));
  };

  const clearHighlights = () => {
    if (window.confirm("Are you sure you want to clear all highlights for this section?")) {
      saveHighlights({});
    }
  };

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      setToolbar(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setToolbar(null);
      return;
    }

    setToolbar({
      top: rect.top + window.scrollY - 50,
      left: rect.left + rect.width / 2,
      show: true
    });
  }, []);

  const applyHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    const findBlockWrapper = (node: Node | null): HTMLElement | null => {
      let curr = node;
      while (curr && curr !== containerRef.current) {
        if (curr.nodeType === 1 && (curr as HTMLElement).hasAttribute('data-block-index')) {
          return curr as HTMLElement;
        }
        curr = curr.parentNode;
      }
      return null;
    };

    const startBlock = findBlockWrapper(startNode);
    const endBlock = findBlockWrapper(endNode);

    if (!startBlock || !endBlock) return;

    const startIndex = parseInt(startBlock.getAttribute('data-block-index') || '0');
    const endIndex = parseInt(endBlock.getAttribute('data-block-index') || '0');

    const newHighlights = { ...highlights };

    for (let i = Math.min(startIndex, endIndex); i <= Math.max(startIndex, endIndex); i++) {
      const blockEl = containerRef.current?.querySelector(`[data-block-index="${i}"]`);
      if (!blockEl) continue;

      let startOffset = 0;
      let endOffset = section.content[i].text.length;

      if (i === startIndex) {
        const offset = getBlockOffset(blockEl, startNode, range.startOffset);
        if (offset !== -1) startOffset = offset;
      }

      if (i === endIndex) {
        const offset = getBlockOffset(blockEl, endNode, range.endOffset);
        if (offset !== -1) endOffset = offset;
      }

      if (startIndex === endIndex && startOffset > endOffset) {
        [startOffset, endOffset] = [endOffset, startOffset];
      }

      if (startOffset < endOffset) {
        const blockHighlights = newHighlights[i] || [];
        blockHighlights.push({ start: startOffset, end: endOffset });
        newHighlights[i] = blockHighlights;
      }
    }

    saveHighlights(newHighlights);
    selection.removeAllRanges();
    setToolbar(null);
  };

  const renderContent = (block: ContentBlock, index: number) => {
    const blockHighlights = highlights[index];
    const content = <HighlightedText text={block.text} highlights={blockHighlights} />;

    const commonProps = {
      key: index,
      'data-block-index': index,
    };

    switch (block.type) {
      case 'heading':
        return (
          <h3 {...commonProps} className="font-heading text-2xl md:text-3xl text-amber-500 mt-16 mb-8 tracking-wide text-center border-b border-amber-500/30 pb-4">
            {content}
          </h3>
        );
      case 'verse':
        return (
          <div {...commonProps} className="my-8 pl-6 md:pl-12 border-l-2 border-amber-900/50 italic text-neutral-400 font-body text-lg leading-relaxed">
            {content}
          </div>
        );
      case 'quote':
        return (
          <blockquote {...commonProps} className="my-12 text-xl md:text-2xl font-heading text-center text-neutral-200 leading-relaxed px-4 md:px-12">
            "{content}"
          </blockquote>
        );
      case 'emphasis':
        return (
          <p {...commonProps} className="my-8 font-heading text-xl text-center text-amber-200 tracking-wide uppercase px-8">
            {content}
          </p>
        );
      case 'separator':
        return (
          <div key={index} className="flex justify-center my-16 opacity-30 select-none">
            <div className="w-2 h-2 bg-amber-500 rounded-full mx-1" />
            <div className="w-2 h-2 bg-amber-500 rounded-full mx-1" />
            <div className="w-2 h-2 bg-amber-500 rounded-full mx-1" />
          </div>
        );
      case 'code-block':
        return (
          <div {...commonProps} className="my-8 bg-neutral-900/50 border border-neutral-800 rounded p-6 font-mono text-sm text-green-400/90 overflow-x-auto whitespace-pre-wrap shadow-inner">
            {content}
          </div>
        );
      case 'scripture-line':
        return (
          <div {...commonProps} className="font-mono text-sm md:text-base text-neutral-400 hover:text-amber-200/80 transition-colors py-0.5 pl-4 border-l border-neutral-800 hover:border-amber-500/30">
            {content}
          </div>
        );
      default:
        return (
          <p {...commonProps} className="mb-6 font-body text-lg md:text-xl leading-8 text-neutral-300">
            {content}
          </p>
        );
    }
  };

  return (
    <main 
      className="flex-1 lg:ml-80 min-h-screen bg-neutral-950 relative overflow-hidden"
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
    >
      <div ref={topRef} />
      
      {/* Highlight Toolbar */}
      {toolbar && toolbar.show && (
        <div 
          className="absolute z-50 transform -translate-x-1/2 flex gap-2"
          style={{ top: toolbar.top, left: toolbar.left }}
        >
          <button
            onClick={applyHighlight}
            className="bg-neutral-900 text-amber-500 px-4 py-2 rounded-full shadow-xl border border-amber-500/30 hover:bg-neutral-800 hover:scale-105 transition-all flex items-center gap-2 font-heading text-xs tracking-widest animate-in fade-in zoom-in duration-200"
          >
            <Highlighter size={14} />
            MARK
          </button>
        </div>
      )}

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 py-24 relative z-10" ref={containerRef}>
        {/* Header */}
        <header className="mb-12 text-center border-b border-neutral-900 pb-12">
          {section.subtitle && (
            <span className="inline-block py-1 px-3 rounded-full bg-amber-900/20 text-amber-500 text-xs font-heading tracking-widest uppercase mb-4 border border-amber-500/20">
              {section.subtitle}
            </span>
          )}
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white mb-4 tracking-tight">
            {section.title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-8 opacity-50" />
        </header>

        {/* Custom Audio Player */}
        {section.audioSrc && (
          <CustomAudioPlayer src={section.audioSrc} title={section.title} />
        )}

        {/* Content */}
        <article className="space-y-2 selection:bg-amber-500/30 selection:text-amber-100">
          {section.content.map((block, index) => renderContent(block, index))}
        </article>

        {/* Footer Navigation */}
        <div className="mt-24 pt-12 border-t border-neutral-900 flex flex-col items-center gap-8">
          {Object.keys(highlights).length > 0 && (
            <button 
              onClick={clearHighlights}
              className="text-neutral-600 hover:text-red-400 text-xs font-mono flex items-center gap-2 transition-colors"
            >
              <Trash2 size={12} />
              CLEAR ANNOTATIONS
            </button>
          )}

          {!isLast ? (
            <button
              onClick={onNext}
              className="group flex items-center gap-4 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full transition-all duration-300 border border-neutral-800 hover:border-amber-500/50"
            >
              <span className="font-heading tracking-widest text-sm">INITIATE NEXT SEQUENCE</span>
              <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-4 animate-pulse" />
              <p className="font-heading text-xl text-amber-200 tracking-widest">SYSTEM INTEGRATION COMPLETE</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};