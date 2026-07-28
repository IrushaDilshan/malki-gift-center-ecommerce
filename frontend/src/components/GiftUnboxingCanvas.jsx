import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ShoppingBag, Plus, Minus } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AVAILABLE_ITEMS = [
  { id: 1, name: 'Premium Assorted Chocolates', price: 4500, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=200' },
  { id: 2, name: 'Custom Message Card', price: 800, image: 'https://images.unsplash.com/photo-1566121933407-3c7365824c87?auto=format&fit=crop&q=80&w=200' },
  { id: 3, name: 'Velvet Ribbon Packaging', price: 1200, image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&q=80&w=200' },
  { id: 4, name: 'Scented Candle', price: 2200, image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&q=80&w=200' },
];

export default function GiftUnboxingCanvas() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const overlayRef = useRef(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [images, setImages] = useState([]);

  // Load Images and setup GSAP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;

    const ctx = canvas.getContext('2d');
    const frameCount = 300;
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

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill();
      }
      tl.kill();
    };
  }, []);

  // Cart Functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
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
          
          <div className="relative z-20 flex flex-col items-center justify-center px-4 mt-32 md:mt-48 text-center pointer-events-auto">
            <h2 className="font-['Anton'] text-5xl md:text-8xl text-white tracking-wide drop-shadow-2xl mb-8">
              UNWRAP THE MAGIC
            </h2>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-bold text-lg px-8 py-4 rounded-full overflow-hidden transition-transform hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.3)]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-orange-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors duration-300">
                <ShoppingBag className="w-5 h-5" />
                BUILD YOUR OWN BOX
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Slide-over Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-[110] w-full md:w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-['Anton'] text-2xl tracking-wide text-slate-900">CUSTOMIZE BOX</h3>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Body - Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Available Add-ons</h4>
          
          {AVAILABLE_ITEMS.map(item => {
            const inCart = cart.find(i => i.id === item.id);
            return (
              <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900">{item.name}</h5>
                    <p className="text-orange-500 font-semibold mt-1">Rs. {item.price.toLocaleString('en-LK')}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {inCart ? (
                      <div className="flex items-center gap-3 bg-slate-100 rounded-full px-1 py-1">
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-sm hover:text-orange-500"><Minus className="w-4 h-4" /></button>
                        <span className="font-bold text-sm w-4 text-center">{inCart.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-sm hover:text-orange-500"><Plus className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)}
                        className="text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-full hover:bg-orange-500 transition-colors"
                      >
                        ADD TO BOX
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer - Checkout */}
        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Subtotal ({cartCount} items)</span>
            <span className="font-['Anton'] text-3xl text-slate-900">Rs. {cartTotal.toLocaleString('en-LK')}</span>
          </div>
          <button 
            disabled={cartCount === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-lg py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-200"
          >
            PROCEED TO CHECKOUT
          </button>
        </div>
      </div>

    </section>
  );
}
