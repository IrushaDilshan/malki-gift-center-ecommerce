import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BadgeCheck, Search, ShoppingCart, Sparkles, Truck, UserCircle, X, Edit, Trash2, ImagePlus, LayoutDashboard, FolderKanban, PlusCircle, ShoppingBag, MessageSquare, Settings, ShieldAlert, Menu } from 'lucide-react'
import logo from './assets/logo.png'

const PRODUCTS_URL = 'https://malki-gift-center-ecommerce.vercel.app/api/products'
const ORDERS_URL = 'https://malki-gift-center-ecommerce.vercel.app/api/orders'
const CATEGORIES_URL = 'https://malki-gift-center-ecommerce.vercel.app/api/categories'
const FEEDBACK_URL = 'https://malki-gift-center-ecommerce.vercel.app/api/products/reviews/all'
const SETTINGS_URL = 'https://malki-gift-center-ecommerce.vercel.app/api/settings'
const ADMIN_SECURITY_URL = 'https://malki-gift-center-ecommerce.vercel.app/api/admin/change-password'

function formatPrice(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '0'
  return number.toLocaleString('en-LK')
}

function resolveImageUrl(image) {
  const fallbackImage = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80'
  if (!image || image.startsWith('http://example.com')) return fallbackImage
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/')) return `https://malki-gift-center-ecommerce.vercel.app${image}`
  return `https://malki-gift-center-ecommerce.vercel.app/${image}`
}

function getStatusBadge(status) {
  switch (status) {
    case 'Shipped': return 'bg-blue-100 text-blue-800'
    case 'Delivered': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-amber-100 text-amber-800'
  }
}

const StoreProductCard = ({ product, onSelect, onAddToCart, resolveImageUrl, formatPrice }) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  
  const images = product?.images && product.images.length > 0 ? product.images : (product?.image ? [product.image] : [])
  const displayImage = images[activeImgIndex] || images[0]

  const stock = Number(product?.stock) || 0
  const isInStock = stock > 0

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
      <div className="relative overflow-hidden cursor-pointer h-60 shrink-0" onClick={() => onSelect(product)}>
        <img src={resolveImageUrl(displayImage)} alt={product?.title ?? 'Gift product'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80' }} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">{product?.category ?? 'Gift'}</p>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 p-5">
        {images.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {images.map((img, idx) => (
              <button 
                key={idx} 
                onMouseEnter={() => setActiveImgIndex(idx)}
                onClick={(e) => { e.stopPropagation(); setActiveImgIndex(idx); }}
                className={`h-12 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImgIndex === idx ? 'border-orange-500 opacity-100 shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
              >
                <img src={resolveImageUrl(img)} alt={`Thumbnail ${idx}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2 mb-4 flex-1">
          <h3 className="line-clamp-2 text-lg font-bold text-slate-950 cursor-pointer hover:text-orange-500 transition" onClick={() => onSelect(product)}>{product?.title ?? 'Untitled Product'}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-500">{product?.description ?? 'A beautifully curated gift.'}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-4">
          <div>
            <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">Price</span>
            <p className="text-2xl font-black text-slate-950">Rs. {formatPrice(product?.price)}</p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{isInStock ? `${stock} in stock` : 'Out of stock'}</div>
        </div>
        <button type="button" disabled={!isInStock} onClick={() => onAddToCart(product)} className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-300/40 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </button>
      </div>
    </article>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Cart state
  const [cartItems, setCartItems] = useState([])
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({ customerName: '', phone: '', address: '' })
  const [province, setProvince] = useState('Western')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Admin state
  const [isAdminView, setIsAdminView] = useState(window.location.pathname.includes('/admin'))
  const [adminTab, setAdminTab] = useState('dashboard')
  const [isAdminMobileMenuOpen, setIsAdminMobileMenuOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Admin Data State
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [feedback, setFeedback] = useState([])
  const [replyText, setReplyText] = useState({})
  const [storeSettings, setStoreSettings] = useState({ phone: '', email: '', address: '', deliveryCharge: 0 })
  const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  // Admin Product Form State
  const [productForm, setProductForm] = useState({ title: '', description: '', price: '', category: '', stock: '' })
  const [productImages, setProductImages] = useState([])
  const [editingProductId, setEditingProductId] = useState(null)
  const [isProductSubmitting, setIsProductSubmitting] = useState(false)

  // Product Details State
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailsImageIndex, setDetailsImageIndex] = useState(0)
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' })
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false)

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    setIsReviewSubmitting(true)
    try {
      const id = selectedProduct._id || selectedProduct.id
      const res = await axios.post(`${PRODUCTS_URL}/${id}/reviews`, reviewForm)
      setSelectedProduct(res.data)
      setProducts(products.map(p => (p._id || p.id) === id ? res.data : p))
      setReviewForm({ customerName: '', rating: 5, comment: '' })
      alert('Review submitted successfully!')
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setIsReviewSubmitting(false)
    }
  }

  // Fetch Products
  useEffect(() => {
    let isMounted = true
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get(PRODUCTS_URL)
        const nextProducts = Array.isArray(response.data) ? response.data : Array.isArray(response.data?.products) ? response.data.products : []
        if (isMounted) setProducts(nextProducts)
      } catch (fetchError) {
        if (isMounted) {
          setError('We could not load the latest gift collection right now.')
          setProducts([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProducts()
    return () => { isMounted = false }
  }, [])

  // Fetch Admin Data
  useEffect(() => {
    if (isAdminView) {
      setOrdersLoading(true)
      Promise.all([
        axios.get(ORDERS_URL).catch(() => ({ data: [] })),
        axios.get(CATEGORIES_URL).catch(() => ({ data: [] })),
        axios.get(FEEDBACK_URL).catch(() => ({ data: [] })),
        axios.get(SETTINGS_URL).catch(() => ({ data: {} }))
      ]).then(([ordersRes, catRes, feedRes, setRes]) => {
        setOrders(ordersRes.data)
        setCategories(catRes.data)
        setFeedback(feedRes.data || [])
        if (setRes.data && Object.keys(setRes.data).length > 0) {
          setStoreSettings(setRes.data)
        }
      }).finally(() => setOrdersLoading(false))
    }
  }, [isAdminView])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return products.filter((product) => {
      const title = product?.title ?? ''
      const category = product?.category ?? ''
      const description = product?.description ?? ''
      const matchesSearch = !normalizedSearch || [title, category, description].some((value) => value.toLowerCase().includes(normalizedSearch))
      const matchesCategory = activeCategory === 'All' || category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, activeCategory])

  const storeCategories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))], [products])
  const hasProducts = filteredProducts.length > 0
  const totalProducts = products.length
  const inStockCount = products.filter((product) => Number(product?.stock) > 0).length

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) || 
                            order.phone?.includes(orderSearch)
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, orderSearch, statusFilter])

  // Cart logic
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)

  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product._id === product._id)
      if (existing) return prev.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      setCartItems(prev => prev.filter(item => (item.product._id || item.product.id) !== productId))
    } else {
      setCartItems(prev => prev.map(item => (item.product._id || item.product.id) === productId ? { ...item, quantity: newQuantity } : item))
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return alert("Your cart is empty!")
    setIsSubmitting(true)
    try {
      const deliveryFee = province === 'Western' ? 350 : 450
      const finalTotal = cartTotal + deliveryFee
      
      const orderData = {
        customerName: checkoutForm.customerName,
        phone: checkoutForm.phone,
        address: checkoutForm.address,
        items: cartItems.map(item => ({ 
          productId: item.product?._id || item.product?.id, 
          productTitle: item.product?.title,
          quantity: item.quantity,
          price: item.product?.price
        })),
        totalAmount: finalTotal,
        deliveryFee: deliveryFee
      }
      await axios.post(ORDERS_URL, orderData)
      alert('🎉 Order placed successfully! Thank you.')
      setCartItems([])
      setIsCheckingOut(false)
      setIsCartOpen(false)
      setCheckoutForm({ customerName: '', phone: '', address: '' })
      
      if (isAdminView) {
        axios.get(ORDERS_URL).then(res => setOrders(res.data)).catch(() => {})
      }
    } catch (error) {
      alert(`Checkout failed: ${error.response?.data?.message || 'Please try again.'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${ORDERS_URL}/${orderId}/status`, { status: newStatus })
      setOrders(orders.map(order => order._id === orderId ? { ...order, status: newStatus } : order))
    } catch (error) {
      alert('Failed to update order status. Please try again.')
    }
  }

  // Admin Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
      const res = await axios.post(CATEGORIES_URL, { name: newCategory })
      setCategories([res.data, ...categories])
      setNewCategory('')
    } catch (error) {
      alert('Failed to add category')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return
    try {
      await axios.delete(`${CATEGORIES_URL}/${id}`)
      setCategories(categories.filter(c => c._id !== id))
    } catch (error) {
      alert('Failed to delete category')
    }
  }

  const handleReplyFeedback = async (id) => {
    const reply = replyText[id]
    if (!reply) return
    try {
      const res = await axios.put(`${FEEDBACK_URL}/${id}/reply`, { reply })
      setFeedback(feedback.map(f => f._id === id ? res.data : f))
      setReplyText(prev => ({ ...prev, [id]: '' }))
      alert('Reply saved!')
    } catch (error) {
      alert('Failed to save reply')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await axios.put(SETTINGS_URL, storeSettings)
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (securityData.newPassword !== securityData.confirmPassword) return alert("Passwords don't match!")
    try {
      await axios.post(ADMIN_SECURITY_URL, { 
        currentPassword: securityData.currentPassword, 
        newPassword: securityData.newPassword 
      })
      alert('Password updated successfully!')
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      alert('Failed to update password')
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setIsProductSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', productForm.title)
      formData.append('description', productForm.description)
      formData.append('price', productForm.price)
      formData.append('category', productForm.category)
      formData.append('stock', productForm.stock)
      if (productImages.length > 0) {
        productImages.forEach(file => formData.append('images', file))
      }

      if (editingProductId) {
        await axios.put(`${PRODUCTS_URL}/${editingProductId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert('Product updated successfully!')
      } else {
        await axios.post(PRODUCTS_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert('Product added successfully!')
      }
      const response = await axios.get(PRODUCTS_URL)
      setProducts(Array.isArray(response.data) ? response.data : [])
      setProductForm({ title: '', description: '', price: '', category: '', stock: '' })
      setProductImages([])
      setEditingProductId(null)
    } catch (error) {
      alert(`Save failed: ${error.response?.data?.message || 'Please try again.'}`)
    } finally {
      setIsProductSubmitting(false)
    }
  }

  const handleEditClick = (product) => {
    setProductForm({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      stock: product.stock || ''
    })
    setEditingProductId(product._id || product.id)
    setProductImages([])
    setAdminTab('add-item')
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return
    try {
      await axios.delete(`${PRODUCTS_URL}/${id}`)
      setProducts(products.filter(p => (p._id || p.id) !== id))
    } catch (error) {
      alert('Delete failed.')
    }
  }

  return (
    <div className={isAdminView ? "h-screen w-full flex flex-col overflow-hidden bg-slate-50 text-slate-900" : "w-full min-h-screen bg-[#FFFDF9] flex flex-col items-center text-slate-900"}>
      <header className={isAdminView ? "z-30 border-b border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(255,170,102,0.12)] backdrop-blur-xl w-full flex-shrink-0" : "w-full sticky top-0 z-50 bg-white shadow-sm transition-all duration-300"}>
        <div className="mx-auto w-full max-w-[98%] md:max-w-[95%] py-2 md:py-3 lg:py-4">
          <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
            
            {/* Logo block */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0 max-w-[35%] sm:max-w-[40%]">
              <img src={logo} alt="Malki Gift Center Logo" className="h-8 md:h-10 w-auto object-contain shrink-0" />
              <div className="flex flex-col justify-center overflow-hidden">
                <p className="hidden md:block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 leading-none mb-0.5">Gift Store</p>
                <h1 className="text-[11px] sm:text-sm md:text-xl font-black tracking-tight text-slate-950 leading-none truncate">Malki Gift Center</h1>
              </div>
            </div>

            {/* Search and Cart block */}
            <div className="flex flex-1 items-center justify-end gap-2">
              {!isAdminView && (
                <label className="flex flex-1 items-center gap-2 rounded-full border border-orange-100 bg-slate-50 px-3 md:px-4 py-2 md:py-2.5 shadow-sm ring-1 ring-transparent transition focus-within:border-orange-300 focus-within:bg-white focus-within:ring-orange-200">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-orange-400 shrink-0" />
                  <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search gifts..." className="w-full bg-transparent text-xs md:text-sm text-slate-700 outline-none placeholder:text-slate-400 min-w-[50px]" />
                </label>
              )}

              {!isAdminView && (
                <button onClick={() => setIsCartOpen(true)} className="shrink-0 p-2 md:p-2.5 hover:bg-orange-50 bg-white border border-orange-100 shadow-sm rounded-full cursor-pointer relative transition-all flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] md:text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white animate-fade-in">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-orange-500" />
                {isCheckingOut ? 'Secure Checkout' : 'Your Cart'}
              </h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {!isCheckingOut ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <div className="h-24 w-24 rounded-full bg-orange-50 flex items-center justify-center">
                        <ShoppingBag className="h-10 w-10 text-orange-300" />
                      </div>
                      <p className="text-lg font-bold text-slate-900">Your cart is empty</p>
                      <p className="text-slate-500 text-sm">Looks like you haven't added any gifts yet.</p>
                      <button onClick={() => setIsCartOpen(false)} className="mt-4 rounded-full bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition">Continue Shopping</button>
                    </div>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 relative group">
                        <img src={resolveImageUrl(item.product?.images?.[0] || item.product?.image)} alt={item.product?.title} className="h-20 w-20 rounded-xl object-cover bg-white" />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 line-clamp-1">{item.product?.title}</h3>
                            <p className="text-sm font-semibold text-orange-500 mt-1">Rs. {formatPrice(item.product?.price)}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm font-black text-slate-900">Rs. {formatPrice(item.product?.price * item.quantity)}</p>
                            
                            <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1 shadow-sm border border-slate-200">
                              <button onClick={() => updateCartQuantity(item.product?._id || item.product?.id, item.quantity - 1)} className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition font-bold text-lg leading-none pb-0.5">-</button>
                              <span className="text-sm font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product?._id || item.product?.id, item.quantity + 1)} className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition font-bold text-lg leading-none pb-0.5">+</button>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setCartItems(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-3 -right-3 rounded-full bg-white p-2 text-rose-500 shadow-md hover:bg-rose-50 hover:scale-110 transition opacity-0 group-hover:opacity-100 sm:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {cartItems.length > 0 && (
                  <div className="border-t border-slate-100 bg-white p-6 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-end">
                      <span className="text-slate-500 font-medium">Subtotal</span>
                      <span className="text-2xl font-black text-slate-900">Rs. {formatPrice(cartTotal)}</span>
                    </div>
                    <button onClick={() => setIsCheckingOut(true)} className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 py-4 font-black text-white shadow-xl shadow-orange-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition">
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-orange-50/50 flex flex-col gap-2 shrink-0">
                  <button type="button" onClick={() => setIsCheckingOut(false)} className="text-sm font-semibold text-orange-600 hover:text-orange-700 self-start mb-2 flex items-center gap-1">← Back to Cart</button>
                  <p className="text-slate-600 font-medium text-sm">Order Summary</p>
                  <p className="text-3xl font-black text-slate-900">Rs. {formatPrice(cartTotal + (province === 'Western' ? 350 : 450))}</p>
                </div>
                
                <form onSubmit={handlePlaceOrder} className="p-6 space-y-5 flex-1 overflow-y-auto">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Customer Name</label>
                    <input required type="text" value={checkoutForm.customerName} onChange={e => setCheckoutForm({...checkoutForm, customerName: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 bg-slate-50" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Phone Number</label>
                    <input required type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 bg-slate-50" placeholder="07XXXXXXXX" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Select Province</label>
                    <select value={province} onChange={e => setProvince(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 bg-slate-50">
                      <option value="Western">Western Province</option>
                      <option value="Other">Outstation / Other Provinces</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Delivery Address</label>
                    <textarea required rows={4} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none resize-none focus:border-orange-400 bg-slate-50" placeholder="Your full address..." />
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 mt-4">
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Items Total</span>
                      <span>Rs. {formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Delivery Fee</span>
                      <span>Rs. {formatPrice(province === 'Western' ? 350 : 450)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-slate-900 text-lg">
                      <span>Grand Total</span>
                      <span>Rs. {formatPrice(cartTotal + (province === 'Western' ? 350 : 450))}</span>
                    </div>
                  </div>

                  <div className="pt-4 pb-8">
                    <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-70 disabled:hover:scale-100">
                      {isSubmitting ? 'Processing Order...' : 'Place Order Now'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}


      <main className={isAdminView ? "flex flex-1 overflow-hidden items-stretch relative bg-slate-50/50" : "mx-auto w-full max-w-[95%] md:max-w-[98%] pb-16 pt-8"}>
        {isAdminView ? (
          <>
            {/* Mobile Top Bar / Hamburger */}
            <div className="md:hidden absolute top-5 left-5 z-40">
              <button onClick={() => setIsAdminMobileMenuOpen(true)} className="p-2.5 bg-white text-slate-900 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-slate-200 hover:bg-slate-50 transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Overlay */}
            {isAdminMobileMenuOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden" onClick={() => setIsAdminMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 flex-shrink-0 select-none p-6 gap-2 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isAdminMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
              <div className="mb-6 px-4 flex justify-between items-center">
                <img src={logo} alt="Admin Logo" className="h-12 w-auto object-contain" />
                <button className="md:hidden text-slate-400 hover:text-white p-1" onClick={() => setIsAdminMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 px-4">Admin Menu</h3>
              
              <button onClick={() => { setAdminTab('dashboard'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <LayoutDashboard className="h-5 w-5" /> Dashboard
              </button>
              <button onClick={() => { setAdminTab('categories'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'categories' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <FolderKanban className="h-5 w-5" /> Categories
              </button>
              <button onClick={() => { setAdminTab('add-item'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'add-item' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <PlusCircle className="h-5 w-5" /> Manage Products
              </button>
              <button onClick={() => { setAdminTab('orders'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'orders' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <ShoppingBag className="h-5 w-5" /> Orders
              </button>
              <button onClick={() => { setAdminTab('feedback'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'feedback' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <MessageSquare className="h-5 w-5" /> Feedback
              </button>
              <button onClick={() => { setAdminTab('settings'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'settings' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Settings className="h-5 w-5" /> Settings
              </button>
              <button onClick={() => { setAdminTab('security'); setIsAdminMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'security' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <ShieldAlert className="h-5 w-5" /> Security
              </button>
            </aside>

            {/* Content Area */}
            <div className="flex-1 p-6 pt-20 md:p-8 overflow-y-auto h-full w-full">
              {adminTab === 'dashboard' && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Dashboard Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center shadow-sm">
                      <p className="text-orange-600 font-bold uppercase tracking-widest text-xs mb-2">Total Products</p>
                      <p className="text-4xl font-black text-slate-900">{products.length}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center shadow-sm">
                      <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Total Orders</p>
                      <p className="text-4xl font-black text-slate-900">{orders.length}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center shadow-sm">
                      <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-2">Feedback Received</p>
                      <p className="text-4xl font-black text-slate-900">{feedback.length}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="xl:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col">
                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Sales Analytics Overview</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Showing revenue trend for the last 7 days</p>
                      </div>
                      
                      <div className="relative w-full flex-1 min-h-[240px] flex items-end">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs font-bold text-slate-400">
                          <span>Rs. 10k</span>
                          <span>Rs. 7.5k</span>
                          <span>Rs. 5k</span>
                          <span>Rs. 2.5k</span>
                          <span>0</span>
                        </div>
                        
                        {/* SVG Chart Area */}
                        <div className="absolute left-16 right-2 top-2 bottom-6">
                          {/* Horizontal grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between">
                            {[...Array(5)].map((_, i) => <div key={i} className="w-full border-t border-slate-100/80 h-0" />)}
                          </div>
                          
                          {/* The SVG curve */}
                          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {/* Area Fill */}
                            <path d="M0,85 C15,75 25,90 40,60 C55,30 65,50 80,35 C90,25 95,20 100,15 L100,100 L0,100 Z" fill="url(#chartGradient)" />
                            {/* Stroke Line */}
                            <path d="M0,85 C15,75 25,90 40,60 C55,30 65,50 80,35 C90,25 95,20 100,15" fill="none" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {/* Data Point Circles */}
                            <circle cx="0" cy="85" r="3" fill="#fff" stroke="#f97316" strokeWidth="2" className="drop-shadow-sm" />
                            <circle cx="40" cy="60" r="3" fill="#fff" stroke="#f97316" strokeWidth="2" className="drop-shadow-sm" />
                            <circle cx="80" cy="35" r="3" fill="#fff" stroke="#f97316" strokeWidth="2" className="drop-shadow-sm" />
                            <circle cx="100" cy="15" r="3" fill="#fff" stroke="#f97316" strokeWidth="2" className="drop-shadow-sm" />
                          </svg>
                        </div>
                        
                        {/* X-axis labels */}
                        <div className="absolute left-16 right-2 bottom-0 flex justify-between text-[10px] sm:text-xs font-bold text-slate-400">
                          <span>Day 1</span>
                          <span>Day 2</span>
                          <span>Day 3</span>
                          <span>Day 4</span>
                          <span>Day 5</span>
                          <span>Day 6</span>
                          <span className="text-orange-500">Today</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Selling Products Section */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Top Selling Products</h3>
                      </div>
                      <div className="space-y-5">
                        {products.slice(0, 5).map((prod, i) => (
                          <div key={prod._id || i} className="flex items-center gap-4 group cursor-default">
                            <img src={resolveImageUrl(prod.images?.[0] || prod.image)} alt={prod.title} className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 transition-transform group-hover:scale-105" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-500 transition-colors">{prod.title}</p>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{prod.category || 'Gift'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-slate-900">{(50 - i * 8)} units</p>
                              <p className="text-xs font-semibold text-emerald-500 mt-0.5">Rs. {formatPrice(prod.price * (50 - i * 8))}</p>
                            </div>
                          </div>
                        ))}
                        {products.length === 0 && <p className="text-sm font-medium text-slate-500 text-center py-4">No product data available.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'categories' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-6">
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Manage Categories</h2>
                  <form onSubmit={handleAddCategory} className="flex gap-4 mb-8 max-w-xl">
                    <input required type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New Category Name" className="border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 text-sm w-full max-w-sm" />
                    <button type="submit" className="rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white hover:bg-slate-800 transition-all shadow-sm">Add Category</button>
                  </form>
                  <div className="max-w-xl">
                    {categories.map(cat => (
                      <div key={cat._id} className="border-b border-slate-50 last:border-none py-3.5 px-2 hover:bg-slate-50/50 rounded-xl flex justify-between items-center text-slate-700 transition-colors">
                        <span className="font-medium">{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat._id)} className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {categories.length === 0 && <p className="text-slate-500 text-sm py-4">No categories found.</p>}
                  </div>
                </div>
              )}

              {adminTab === 'add-item' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-6">
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Manage Products</h2>
                  <div className="grid gap-10 xl:grid-cols-[400px_1fr]">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 h-fit shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                      <form onSubmit={handleProductSubmit} className="space-y-4">
                        <input required type="text" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white" placeholder="Product Name" />
                        <textarea required rows={3} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white" placeholder="Product details..." />
                        <div className="grid grid-cols-2 gap-4">
                          <input required type="number" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white" placeholder="Price" />
                          <input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white" placeholder="Stock" />
                        </div>
                        <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white">
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                          <ImagePlus className="h-5 w-5" />
                          <span className="truncate max-w-[200px]">{productImages.length > 0 ? `${productImages.length} file(s) selected` : (editingProductId ? 'Change Images (Optional)' : 'Upload Images')}</span>
                          <input type="file" multiple name="images" accept="image/*" className="hidden" onChange={e => setProductImages(Array.from(e.target.files))} />
                        </label>
                        
                        <div className="pt-4 flex gap-3">
                          {editingProductId && (
                            <button type="button" onClick={() => { setEditingProductId(null); setProductForm({title:'',description:'',price:'',category:'',stock:''}); setProductImage(null); }} className="flex-1 rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-colors">Cancel</button>
                          )}
                          <button type="submit" disabled={isProductSubmitting} className="flex-[2] rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-70 transition-colors">
                            {isProductSubmitting ? 'Saving...' : (editingProductId ? 'Update' : 'Add')}
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <div className="overflow-x-auto h-full max-h-[600px]">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="sticky top-0 bg-slate-50/80 backdrop-blur text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 z-10">
                            <tr>
                              <th className="px-6 py-4 font-bold">Image</th>
                              <th className="px-6 py-4 font-bold">Title</th>
                              <th className="px-6 py-4 font-bold">Details</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {products.map(p => (
                              <tr key={p._id || p.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <img src={resolveImageUrl(p.images?.[0] || p.image)} alt={p.title} className="h-12 w-12 rounded-lg border border-slate-100 object-cover shadow-sm bg-white" />
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900 max-w-[200px] truncate">{p.title}</td>
                                <td className="px-6 py-4">
                                  <p className="font-bold text-slate-900">Rs. {formatPrice(p.price)}</p>
                                  <span className="text-xs font-semibold text-slate-500">{p.stock} in stock</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEditClick(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteProduct(p._id || p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'orders' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-6">
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Order Management</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <input 
                      type="text" 
                      placeholder="Search by customer name or phone..." 
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white"
                    />
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-48 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 bg-white"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  {ordersLoading ? <p className="text-slate-500 text-sm">Loading orders...</p> : orders.length === 0 ? <p className="text-slate-500 text-sm">No orders yet.</p> : filteredOrders.length === 0 ? <p className="text-slate-500 text-sm">No matching orders.</p> : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4 font-bold">Date</th>
                            <th className="px-6 py-4 font-bold">Customer</th>
                            <th className="px-6 py-4 font-bold">Total</th>
                            <th className="px-6 py-4 font-bold">Status & Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredOrders.map(order => (
                            <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-5 text-slate-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-5">
                                <p className="font-bold text-slate-900">{order.customerName}</p>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">{order.phone}</p>
                              </td>
                              <td className="px-6 py-5 font-black text-slate-900">Rs. {formatPrice(order.totalAmount)}</td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold ${getStatusBadge(order.status)} shadow-sm`}>{order.status}</span>
                                  {order.status === 'Pending' && <button onClick={() => handleUpdateOrderStatus(order._id, 'Shipped')} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors hover:bg-blue-100">Mark Shipped</button>}
                                  {order.status === 'Shipped' && <button onClick={() => handleUpdateOrderStatus(order._id, 'Delivered')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors hover:bg-emerald-100">Mark Delivered</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'feedback' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-6">
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Customer Feedback & Reviews</h2>
                  {(!feedback || feedback.length === 0) ? <p className="text-slate-500 text-sm">No feedback received.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {feedback.map(item => (
                        <div key={item._id} className="bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-2xl p-5 transition-all duration-200 shadow-sm relative flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner">
                                {item.customerName?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{item.customerName}</p>
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {item.rating && <span className="text-xs font-bold text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md shadow-sm">★ {item.rating}.0</span>}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed mt-1">{item.comment || item.message}</p>
                          <div className="mt-auto pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium line-clamp-1">{item.productTitle ? `On: ${item.productTitle}` : 'Store Feedback'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'settings' && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Store Settings</h2>
                  <form onSubmit={handleSaveSettings} className="max-w-xl space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-slate-700">Contact Phone</label>
                      <input type="text" value={storeSettings.phone} onChange={e => setStoreSettings({...storeSettings, phone: e.target.value})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Contact Email</label>
                      <input type="email" value={storeSettings.email} onChange={e => setStoreSettings({...storeSettings, email: e.target.value})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Store Address</label>
                      <textarea rows={2} value={storeSettings.address} onChange={e => setStoreSettings({...storeSettings, address: e.target.value})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none resize-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Delivery Charge (Rs.)</label>
                      <input type="number" min="0" value={storeSettings.deliveryCharge} onChange={e => setStoreSettings({...storeSettings, deliveryCharge: Number(e.target.value)})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition shadow-lg shadow-orange-200">Save Settings</button>
                  </form>
                </div>
              )}

              {adminTab === 'security' && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Admin Security</h2>
                  <form onSubmit={handleChangePassword} className="max-w-md space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-slate-700">Current Password</label>
                      <input required type="password" value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">New Password</label>
                      <input required type="password" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                      <input required type="password" value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Update Password</button>
                  </form>
                </div>
              )}
            </div>
          </>
        ) : selectedProduct ? (
          // --- Product Details View ---
          <div className="w-full min-h-[calc(100vh-80px)] bg-[#FFFDF9] flex flex-col">
            {/* Sub-Navigation Bar */}
            <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-start items-center border-b border-slate-100">
              <button onClick={() => setSelectedProduct(null)} className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full shadow-sm flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95" title="Back to Shop">
                <span className="text-xl leading-none font-medium text-slate-500 group-hover:text-slate-900 transition-colors">&#8592;</span>
              </button>
            </div>
            
            {/* Main Content Grid Wrapper */}
            <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
              
              {/* Left Column (Image Container) */}
              <div className="w-full flex flex-col items-center justify-start">
                <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-100 p-2 relative group">
                  {(() => {
                    const images = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : (selectedProduct.image ? [selectedProduct.image] : [])
                    const displayImage = images[detailsImageIndex] || images[0]
                    return (
                      <>
                        <img src={resolveImageUrl(displayImage)} alt={selectedProduct.title} className="w-full h-auto max-h-[60vh] object-contain rounded-[1.5rem] transition-all duration-300" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80' }} />
                        
                        {images.length > 1 && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDetailsImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1); }}
                              className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-lg backdrop-blur hover:bg-white transition opacity-0 group-hover:opacity-100"
                            >
                              <span className="text-3xl font-medium leading-none pb-1">&#8249;</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDetailsImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0); }}
                              className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-lg backdrop-blur hover:bg-white transition opacity-0 group-hover:opacity-100"
                            >
                              <span className="text-3xl font-medium leading-none pb-1">&#8250;</span>
                            </button>
                            
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                              {images.map((_, idx) => (
                                <button key={idx} onClick={() => setDetailsImageIndex(idx)} className={`h-2.5 rounded-full transition-all ${detailsImageIndex === idx ? 'w-8 bg-orange-500' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Right Column (Details Scroll Panel) */}
              <div className="w-full flex flex-col gap-6">
                <div className="space-y-4">
                  <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-600">{selectedProduct.category}</span>
                  <h2 className="text-4xl lg:text-5xl font-black text-slate-950 leading-tight">{selectedProduct.title}</h2>
                  <div className="flex items-center gap-4">
                    <p className="text-4xl font-black text-orange-500">Rs. {formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>
                
                <div className="h-px w-full bg-slate-100"></div>
                
                <div className="prose prose-slate prose-lg">
                  <p className="text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                </div>
                
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Availability</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${selectedProduct.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {selectedProduct.stock > 0 ? (
                        <><BadgeCheck className="h-4 w-4" /> {selectedProduct.stock} in stock</>
                      ) : (
                        <><X className="h-4 w-4" /> Out of stock</>
                      )}
                    </span>
                  </div>
                  
                  <button 
                    type="button" 
                    disabled={selectedProduct.stock <= 0} 
                    onClick={() => handleAddToCart(selectedProduct)} 
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 px-8 py-5 text-xl font-black text-white shadow-xl shadow-orange-200/50 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-300/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <ShoppingCart className="h-6 w-6" /> Add to Cart
                  </button>
                  <p className="text-center text-xs font-medium text-slate-400 mt-2">Secure checkout & fast delivery</p>
                </div>

                {/* Reviews Section */}
                <div className="pt-6">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-orange-500" />
                    Customer Reviews
                  </h3>
                  <div className="space-y-4 mb-8">
                    {selectedProduct.reviews?.length > 0 ? selectedProduct.reviews.map((r, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">{r.customerName.charAt(0).toUpperCase()}</div>
                            {r.customerName}
                          </span>
                          <div className="flex text-amber-400 text-sm drop-shadow-sm">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm">{r.comment}</p>
                        <p className="text-xs text-slate-400 mt-3 font-medium">{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-sm font-medium text-slate-500">No reviews yet. Be the first to share your experience!</p>
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleReviewSubmit} className="bg-gradient-to-br from-orange-50 to-amber-50/50 p-6 sm:p-8 rounded-[2rem] border border-orange-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><MessageSquare className="h-32 w-32" /></div>
                    <h4 className="font-bold text-xl text-slate-900 mb-6 relative z-10">Write a Review</h4>
                    <div className="space-y-5 relative z-10">
                      <input required type="text" placeholder="Your Name" value={reviewForm.customerName} onChange={e => setReviewForm({...reviewForm, customerName: e.target.value})} className="w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 outline-none focus:border-orange-400 focus:bg-white transition shadow-sm" />
                      <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})} className="w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 outline-none focus:border-orange-400 focus:bg-white transition shadow-sm">
                        <option value={5}>5 Stars - Excellent</option>
                        <option value={4}>4 Stars - Very Good</option>
                        <option value={3}>3 Stars - Average</option>
                        <option value={2}>2 Stars - Poor</option>
                        <option value={1}>1 Star - Terrible</option>
                      </select>
                      <textarea required placeholder="Your Comment" rows={3} value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} className="w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 outline-none resize-none focus:border-orange-400 focus:bg-white transition shadow-sm" />
                      <button type="submit" disabled={isReviewSubmitting} className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-70 transition">
                        {isReviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // --- Store View ---
          <>
            {!searchQuery && (
              <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_20px_80px_rgba(253,186,116,0.25)] backdrop-blur xl:p-10">
                <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-200/30 blur-3xl" />
                <div className="absolute -bottom-10 left-8 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl" />
                <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div className="space-y-6">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                      <Truck className="h-4 w-4" />
                      Fresh arrivals, curated for every occasion
                    </span>
                    <div className="space-y-4">
                      <h2 className="max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl lg:text-6xl">Beautiful gifts for birthdays, celebrations, and thoughtful moments.</h2>
                      <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Explore handpicked surprises from Malki Gift Center. Every product card is pulled straight from your backend, so the storefront stays in sync with your inventory.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-orange-100"><span className="block text-2xl font-black text-slate-950">{totalProducts}</span>Gifts visible</div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-orange-100"><span className="block text-2xl font-black text-slate-950">{inStockCount}</span>In stock now</div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-orange-100"><span className="block text-2xl font-black text-slate-950">24/7</span>Browse anytime</div>
                    </div>
                  </div>
                  <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
                    <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-orange-200/70 via-rose-200/70 to-amber-100/70 blur-2xl" />
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white p-4 shadow-2xl shadow-orange-200/40">
                      <img src="https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1200&q=80" alt="Gift arrangement showcase" className="h-72 w-full rounded-[1.5rem] object-cover" />
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Featured Collection</p>
                        <p className="text-lg font-bold text-slate-950">Elegant gifting, wrapped with care.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Category Tabs */}
            <section className="mt-10">
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 px-4">
                {storeCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all shadow-sm ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-orange-200 hover:text-orange-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-10">
              {loading ? (
                <div className="rounded-[2rem] border border-orange-100 bg-white/80 p-10 text-center shadow-sm shadow-orange-100">
                  <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
                  <p className="text-lg font-semibold text-slate-900">Loading the gift collection...</p>
                </div>
              ) : error ? (
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
                  <p className="text-lg font-semibold">Could not load products</p><p className="mt-2 text-sm">{error}</p>
                </div>
              ) : !hasProducts ? (
                <div className="rounded-[2rem] border border-dashed border-orange-200 bg-white/80 p-10 text-center shadow-sm shadow-orange-100">
                  <p className="text-lg font-semibold text-slate-900">No gifts available yet</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-orange-200 bg-white/80 p-10 text-center shadow-sm shadow-orange-100">
                  <p className="text-lg font-semibold text-slate-900">No gifts matched your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <StoreProductCard 
                      key={product?._id ?? product?.id ?? product?.title} 
                      product={product} 
                      onSelect={(p) => { 
                        setSelectedProduct(p); 
                        setDetailsImageIndex(0); 
                        window.scrollTo(0, 0); 
                      }} 
                      onAddToCart={handleAddToCart}
                      resolveImageUrl={resolveImageUrl}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
