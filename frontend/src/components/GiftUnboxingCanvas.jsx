import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


export default function GiftUnboxingCanvas() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const overlayRef = useRef(null);
  
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [images, setImages] = useState([]);

  // Load Images and setup GSAP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;

    const ctx = canvas.getContext('2d');
    const frameCount = 192;
    let currentFrameIndex = 0;
    const currentFrame = (index) => `/sequence/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.png`;

    const localImages = [];
    let loadedCount = 0;

    const renderCanvasFrame = (index, customArray) => {
      const activeList = customArray || images;
      if (!activeList || activeList.length === 0) return;
      
      let imageToDraw = null;
      // Search backwards first
      for (let i = index; i >= 0; i--) {
        const img = activeList[i];
        if (img && img.complete && img.naturalWidth !== 0 && img.naturalHeight !== 0) {
          imageToDraw = img;
          break;
        }
      }
      // If none found backwards, search forwards
      if (!imageToDraw) {
        for (let i = index + 1; i < activeList.length; i++) {
          const img = activeList[i];
          if (img && img.complete && img.naturalWidth !== 0 && img.naturalHeight !== 0) {
            imageToDraw = img;
            break;
          }
        }
      }
      
      if (!imageToDraw) return;
      
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const hRatio = canvas.width / imageToDraw.naturalWidth;
        const vRatio = canvas.height / imageToDraw.naturalHeight;
        const ratio = Math.max(hRatio, vRatio); // Use cover to prevent inner borders
        
        const centerShift_x = (canvas.width - imageToDraw.naturalWidth * ratio) / 2;
        const centerShift_y = 0; // Anchor directly to the top edge (0)


        ctx.drawImage(
          imageToDraw, 
          0, 0, imageToDraw.naturalWidth, imageToDraw.naturalHeight,
          centerShift_x, centerShift_y, imageToDraw.naturalWidth * ratio, imageToDraw.naturalHeight * ratio
        );
      } catch (e) {
        // Silently ignore drawing errors for broken frames
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderCanvasFrame(currentFrameIndex, localImages);
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();



    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === frameCount) {
        setImagesLoaded(true);
        setImages(localImages);
        renderCanvasFrame(0, localImages);
      }
    };

    // Preload
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      img.onload = () => {
        // Aggressively attempt to draw if we are still downloading frames to avoid blank screen
        renderCanvasFrame(currentFrameIndex, localImages);
        checkAllLoaded();
      };
      img.onerror = () => {
        console.warn("Missing sequence frame:", img.src);
        checkAllLoaded();
      };
      localImages.push(img);
    }

    let gsapCtx = gsap.context(() => {
      let tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          end: '+=400%',
          scrub: 0.3,
          pin: true,
          anticipatePin: 1,
          pinSpacing: true,
          onUpdate: (self) => {
            currentFrameIndex = Math.min(frameCount - 1, Math.max(0, Math.floor(self.progress * (frameCount - 1))));
            renderCanvasFrame(currentFrameIndex, localImages);
          }
        }
      });

      // Dummy tween to stretch the timeline duration to 1 so the overlay fade happens at a relative percentage
      tl.to({}, { duration: 1 });

      tl.to(overlayRef.current, {
        opacity: 0,
        y: -30,
        ease: 'none',
        duration: 0.55
      }, 0.25);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      gsapCtx.revert(); // Automatically cleans up and un-pins all ScrollTriggers properly!
    };
  }, []);

  return (
    <div className="w-full">
      <section ref={wrapperRef} className="relative w-full h-screen bg-gradient-to-b from-[#707275] to-[#d0d1d4]">
        
        {/* Sticky Canvas Container */}
        <div className="sticky top-0 w-full h-screen overflow-hidden bg-gradient-to-b from-[#707275] to-[#d0d1d4]">
          
          {/* The Sequence Canvas */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />

          {/* Overlay Content */}
          <div ref={overlayRef} className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          </div>

        </div>

        {/* Slide-over Drawer Overlay */}
      </section>
    </div>
  );
}
