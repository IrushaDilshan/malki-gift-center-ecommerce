import React, { useState, useEffect } from 'react';

const ITEMS = [
  { id: 4, name: 'Watch', image: '/assets/3d-watch.png', bg: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 3, name: 'Headphones', image: '/assets/3d-headphones.png', bg: 'linear-gradient(135deg, #b45309, #f59e0b)' },
  { id: 1, name: 'Chocolates', image: '/assets/3d-chocolates.png', bg: 'linear-gradient(135deg, #881337, #e11d48)' },
  { id: 2, name: 'Teddy', image: '/assets/3d-teddy.png', bg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' },
];

export default function MalkiGiftHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Preload images for fluid 60fps performance
    ITEMS.forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ITEMS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const getRoleStyle = (index: number) => {
    const diff = (index - activeIndex + ITEMS.length) % ITEMS.length;
    const isMobile = windowWidth < 768;
    
    // Default base styles
    let baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      height: '45vh',
      maxHeight: '400px',
      transform: 'translate(-50%, -50%) scale(0.4)',
      opacity: 0,
      zIndex: 0,
      filter: 'drop-shadow(0 0px 0px rgba(0,0,0,0)) blur(10px)',
      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
    };

    if (diff === 0) {
      // center centerpiece
      baseStyle = {
        ...baseStyle,
        left: '50%',
        height: isMobile ? '55vh' : '78vh',
        maxHeight: isMobile ? '500px' : '750px',
        minHeight: '500px',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        zIndex: 30, // strong priority
        filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.5)) blur(0px)',
      };
    } else if (diff === 1) {
      // right item
      baseStyle = {
        ...baseStyle,
        left: isMobile ? '150%' : '88%',
        transform: 'translate(-50%, -50%) scale(0.7)',
        opacity: isMobile ? 0 : 0.75, // completely hidden on mobile
        zIndex: 10,
        filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.3)) blur(0px)',
      };
    } else if (diff === ITEMS.length - 1) {
      // left item
      baseStyle = {
        ...baseStyle,
        left: isMobile ? '-50%' : '12%',
        transform: 'translate(-50%, -50%) scale(0.7)',
        opacity: isMobile ? 0 : 0.75, // completely hidden on mobile
        zIndex: 10,
        filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.3)) blur(0px)',
      };
    } else {
      // back
      baseStyle = {
        ...baseStyle,
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0.4)',
        opacity: 0, // completely hide back item 
        zIndex: 5,
        filter: 'blur(5px)',
      };
    }
    return baseStyle;
  };

  return (
    <div 
      className="relative w-full h-[calc(100vh-70px)] overflow-hidden flex items-center justify-center font-['Inter']"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradients */}
      {ITEMS.map((item, index) => (
        <div
          key={`bg-${item.id}`}
          className="absolute inset-0 transition-opacity duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            background: item.bg,
            opacity: index === activeIndex ? 1 : 0,
            zIndex: 0
          }}
        />
      ))}

      {/* Massive Watermark Ghost Text */}
      <div className="absolute top-[10%] w-full flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <h1 
          className="font-['Anton'] text-white whitespace-nowrap leading-none text-center"
          style={{
            fontSize: windowWidth < 768 ? 'clamp(60px, 18vw, 150px)' : 'clamp(110px, 26vw, 420px)',
            letterSpacing: '0.05em',
            width: '100%',
            opacity: 0.05
          }}
        >
          MALKIGIFT
        </h1>
      </div>

      {/* Carousel Items */}
      <div className="relative w-full max-w-7xl h-full flex items-center justify-center z-10">
        {ITEMS.map((item, index) => (
          <div 
            key={item.id}
            style={getRoleStyle(index)}
            className="flex items-center justify-center will-change-transform transition-all duration-500 ease-out"
          >
            <img 
              src={item.image} 
              alt={item.name} 
              className="h-full w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
