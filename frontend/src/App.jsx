import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BadgeCheck, Search, ShoppingCart, Sparkles, Truck, UserCircle, X, Edit, Trash2, ImagePlus, LayoutDashboard, FolderKanban, PlusCircle, ShoppingBag, MessageSquare, Settings, ShieldAlert } from 'lucide-react'
import logo from './assets/logo.png'

const PRODUCTS_URL = 'http://localhost:5000/api/products'
const ORDERS_URL = 'http://localhost:5000/api/orders'
const CATEGORIES_URL = 'http://localhost:5000/api/categories'
const FEEDBACK_URL = 'http://localhost:5000/api/products/reviews/all'
const SETTINGS_URL = 'http://localhost:5000/api/settings'
const ADMIN_SECURITY_URL = 'http://localhost:5000/api/admin/change-password'

function formatPrice(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '0'
  return number.toLocaleString('en-LK')
}

function resolveImageUrl(image) {
  const fallbackImage = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80'
  if (!image || image.startsWith('http://example.com')) return fallbackImage
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/')) return `http://localhost:5000${image}`
  return `http://localhost:5000/${image}`
}

function getStatusBadge(status) {
  switch (status) {
    case 'Shipped': return 'bg-blue-100 text-blue-800'
    case 'Delivered': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-amber-100 text-amber-800'
  }
}

function App() {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Cart state
  const [cartItems, setCartItems] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutDetails, setCheckoutDetails] = useState({ customerName: '', phoneNumber: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Admin state
  const [isAdminView, setIsAdminView] = useState(window.location.pathname.includes('/admin'))
  const [adminTab, setAdminTab] = useState('dashboard')
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
    if (!normalizedSearch) return products
    return products.filter((product) => {
      const title = product?.title ?? ''
      const category = product?.category ?? ''
      const description = product?.description ?? ''
      return [title, category, description].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [products, searchQuery])

  const hasProducts = filteredProducts.length > 0
  const totalProducts = products.length
  const inStockCount = products.filter((product) => Number(product?.stock) > 0).length

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) || 
                            order.phoneNumber?.includes(orderSearch)
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

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return alert("Your cart is empty!")
    setIsSubmitting(true)
    try {
      const orderData = {
        customerName: checkoutDetails.customerName,
        phoneNumber: checkoutDetails.phoneNumber,
        address: checkoutDetails.address,
        cartItems: cartItems.map(item => ({ product: item.product?._id || item.product?.id, quantity: item.quantity })),
        totalPrice: cartTotal
      }
      await axios.post(ORDERS_URL, orderData)
      alert('Order placed successfully! Thank you.')
      setCartItems([])
      setShowCheckout(false)
      setCheckoutDetails({ customerName: '', phoneNumber: '', address: '' })
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
      <header className={isAdminView ? "z-30 border-b border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(255,170,102,0.12)] backdrop-blur-xl w-full flex-shrink-0" : "w-full sticky top-0 z-50 bg-[#FFFDF9]/90 backdrop-blur-md shadow-sm transition-all duration-300"}>
        <div className="mx-auto flex w-full max-w-[95%] md:max-w-[98%] flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Malki Gift Center Logo" className="h-12 w-auto object-contain" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-500">Gift Store</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Malki Gift Center</h1>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center lg:justify-end">
            {!isAdminView && (
              <label className="flex w-full items-center gap-3 rounded-full border border-orange-100 bg-white px-4 py-3 shadow-sm shadow-orange-100/60 ring-1 ring-transparent transition focus-within:border-orange-300 focus-within:ring-orange-200 lg:max-w-md">
                <Search className="h-5 w-5 text-orange-400" />
                <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search gifts..." className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              </label>
            )}

            <div className="flex items-center justify-between gap-3 lg:justify-center">
              {!isAdminView && (
                <button onClick={() => setIsCartOpen(true)} className="p-3 hover:bg-orange-50 bg-white border border-orange-100 shadow-sm shadow-orange-100/60 rounded-full cursor-pointer relative transition-all flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-orange-500" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-fade-in">
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
                Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-6 w-6" />
              </button>
            </div>
            
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
                        <p className="text-sm font-semibold text-orange-500 mt-1">Rs. {formatPrice(item.product?.price)} x {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-slate-900 mt-2">Rs. {formatPrice(item.product?.price * item.quantity)}</p>
                    </div>
                    <button onClick={() => setCartItems(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-3 -right-3 rounded-full bg-white p-2 text-rose-500 shadow-md hover:bg-rose-50 hover:scale-110 transition">
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
                <button onClick={() => { setIsCartOpen(false); setShowCheckout(true); }} className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 py-4 font-black text-white shadow-xl shadow-orange-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b border-orange-100">
              <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-500 hover:text-slate-700"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700 mb-4">Total: Rs. {formatPrice(cartTotal)}</p>
              <input required type="text" value={checkoutDetails.customerName} onChange={e => setCheckoutDetails({...checkoutDetails, customerName: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" placeholder="Name" />
              <input required type="tel" value={checkoutDetails.phoneNumber} onChange={e => setCheckoutDetails({...checkoutDetails, phoneNumber: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" placeholder="Phone" />
              <textarea required rows={3} value={checkoutDetails.address} onChange={e => setCheckoutDetails({...checkoutDetails, address: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none resize-none focus:border-orange-400" placeholder="Address" />
              <button type="submit" disabled={isSubmitting} className="w-full mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 font-bold text-white shadow hover:opacity-90 disabled:opacity-70">
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className={isAdminView ? "flex flex-1 overflow-hidden items-stretch" : "mx-auto w-full max-w-[95%] md:max-w-[98%] pb-16 pt-8"}>
        {isAdminView ? (
          <>
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 flex-shrink-0 select-none p-6 gap-2">
              <div className="mb-6 px-4">
                <img src={logo} alt="Admin Logo" className="h-12 w-auto object-contain" />
              </div>
              <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 px-4">Admin Menu</h3>
              
              <button onClick={() => setAdminTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <LayoutDashboard className="h-5 w-5" /> Dashboard
              </button>
              <button onClick={() => setAdminTab('categories')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'categories' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <FolderKanban className="h-5 w-5" /> Categories
              </button>
              <button onClick={() => setAdminTab('add-item')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'add-item' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <PlusCircle className="h-5 w-5" /> Manage Products
              </button>
              <button onClick={() => setAdminTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'orders' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <ShoppingBag className="h-5 w-5" /> Orders
              </button>
              <button onClick={() => setAdminTab('feedback')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'feedback' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <MessageSquare className="h-5 w-5" /> Feedback
              </button>
              <button onClick={() => setAdminTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'settings' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Settings className="h-5 w-5" /> Settings
              </button>
              <button onClick={() => setAdminTab('security')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${adminTab === 'security' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <ShieldAlert className="h-5 w-5" /> Security
              </button>
            </aside>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto h-full w-full">
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
                </div>
              )}

              {adminTab === 'categories' && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Manage Categories</h2>
                  <form onSubmit={handleAddCategory} className="flex gap-4 mb-8 max-w-md">
                    <input required type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New Category Name" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400" />
                    <button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition">Add</button>
                  </form>
                  <ul className="divide-y divide-slate-100 max-w-md">
                    {categories.map(cat => (
                      <li key={cat._id} className="py-4 flex items-center justify-between">
                        <span className="font-medium text-slate-700">{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat._id)} className="text-rose-500 hover:text-rose-700 p-2"><Trash2 className="h-5 w-5" /></button>
                      </li>
                    ))}
                    {categories.length === 0 && <p className="text-slate-500">No categories found.</p>}
                  </ul>
                </div>
              )}

              {adminTab === 'add-item' && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Manage Products</h2>
                  <div className="grid gap-10 lg:grid-cols-[400px_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
                      <h3 className="text-xl font-bold text-slate-900 mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                      <form onSubmit={handleProductSubmit} className="space-y-4">
                        <input required type="text" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" placeholder="Product Name" />
                        <textarea required rows={3} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none resize-none focus:border-orange-400" placeholder="Product details..." />
                        <div className="grid grid-cols-2 gap-4">
                          <input required type="number" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" placeholder="Price" />
                          <input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400" placeholder="Stock" />
                        </div>
                        <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400 bg-white">
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                          <ImagePlus className="h-5 w-5" />
                          <span className="truncate max-w-[200px]">{productImages.length > 0 ? `${productImages.length} file(s) selected` : (editingProductId ? 'Change Images (Optional)' : 'Upload Images')}</span>
                          <input type="file" multiple name="images" accept="image/*" className="hidden" onChange={e => setProductImages(Array.from(e.target.files))} />
                        </label>
                        
                        <div className="pt-4 flex gap-3">
                          {editingProductId && (
                            <button type="button" onClick={() => { setEditingProductId(null); setProductForm({title:'',description:'',price:'',category:'',stock:''}); setProductImage(null); }} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
                          )}
                          <button type="submit" disabled={isProductSubmitting} className="flex-[2] rounded-xl bg-slate-900 py-3 font-bold text-white shadow hover:bg-slate-800 disabled:opacity-70">
                            {isProductSubmitting ? 'Saving...' : (editingProductId ? 'Update' : 'Add')}
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="overflow-x-auto h-full max-h-[600px]">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200 z-10">
                            <tr><th className="px-4 py-3">Image</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Details</th><th className="px-4 py-3 text-right">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {products.map(p => (
                              <tr key={p._id || p.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3"><img src={resolveImageUrl(p.images?.[0] || p.image)} alt={p.title} className="h-10 w-10 rounded-md object-cover" /></td>
                                <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                                <td className="px-4 py-3">Rs. {formatPrice(p.price)}<br/><span className="text-xs text-slate-500">{p.stock} in stock</span></td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => handleEditClick(p)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                                  <button onClick={() => handleDeleteProduct(p._id || p.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Order Management</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <input 
                      type="text" 
                      placeholder="Search by customer name or phone..." 
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400"
                    />
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-48 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400 bg-white"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  {ordersLoading ? <p>Loading orders...</p> : orders.length === 0 ? <p>No orders yet.</p> : filteredOrders.length === 0 ? <p>No matching orders.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                          <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Status & Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.map(order => (
                            <tr key={order._id}>
                              <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}<br/><span className="text-xs font-normal text-slate-500">{order.phoneNumber}</span></td>
                              <td className="px-6 py-4 font-bold">Rs. {formatPrice(order.totalPrice)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>{order.status}</span>
                                  {order.status === 'Pending' && <button onClick={() => handleUpdateOrderStatus(order._id, 'Shipped')} className="text-xs font-medium text-blue-600 hover:underline">Mark Shipped</button>}
                                  {order.status === 'Shipped' && <button onClick={() => handleUpdateOrderStatus(order._id, 'Delivered')} className="text-xs font-medium text-emerald-600 hover:underline">Mark Delivered</button>}
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
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Customer Feedback & Reviews</h2>
                  {(!feedback || feedback.length === 0) ? <p>No feedback received.</p> : (
                    <div className="space-y-6">
                      {feedback.map(item => (
                        <div key={item._id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-bold text-slate-900">{item.customerName}</p>
                              <p className="text-xs text-slate-500 font-semibold">{item.productTitle ? `Product: ${item.productTitle}` : 'Store Feedback'}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block mb-1">{new Date(item.createdAt).toLocaleDateString()}</span>
                              {item.rating && <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-full">{item.rating} Stars</span>}
                            </div>
                          </div>
                          <p className="text-slate-700">{item.comment || item.message}</p>
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
          <div className="w-full max-w-[1440px] mx-auto bg-white p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_80px_rgba(253,186,116,0.15)] border border-slate-100 mt-4 mb-16">
            <button onClick={() => setSelectedProduct(null)} className="mb-8 inline-flex items-center gap-2 rounded-full bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-orange-500">
              <X className="h-4 w-4" /> Back to Shop
            </button>
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] items-start">
              {/* Left Column */}
              <div className="space-y-12">
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 border border-slate-100 p-4">
                  <img src={resolveImageUrl(selectedProduct.images?.[0] || selectedProduct.image)} alt={selectedProduct.title} className="w-full h-auto max-h-[600px] object-cover rounded-[1.5rem]" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80' }} />
                </div>
                
                {/* Reviews Section */}
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-orange-500" />
                    Customer Reviews
                  </h3>
                  <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
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

              {/* Right Column */}
              <div className="sticky top-28 space-y-8">
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
              </div>
            </div>
          </div>
        ) : (
          // --- Store View ---
          <>
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
                    <h2 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">Beautiful gifts for birthdays, celebrations, and thoughtful moments.</h2>
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
                  {filteredProducts.map((product) => {
                    const stock = Number(product?.stock) || 0
                    const isInStock = stock > 0
                    return (
                      <article key={product?._id ?? product?.id ?? product?.title} className="group overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="relative overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                          <img src={resolveImageUrl(product?.images?.[0] || product?.image)} alt={product?.title ?? 'Gift product'} className="h-60 w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80' }} />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-4 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">{product?.category ?? 'Gift'}</p>
                          </div>
                        </div>
                        <div className="space-y-4 p-5">
                          <div className="space-y-2">
                            <h3 className="line-clamp-2 text-lg font-bold text-slate-950 cursor-pointer hover:text-orange-500 transition" onClick={() => setSelectedProduct(product)}>{product?.title ?? 'Untitled Product'}</h3>
                            <p className="line-clamp-2 text-sm leading-6 text-slate-500">{product?.description ?? 'A beautifully curated gift.'}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">Price</span>
                              <p className="text-2xl font-black text-slate-950">Rs. {formatPrice(product?.price)}</p>
                            </div>
                            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{isInStock ? `${stock} in stock` : 'Out of stock'}</div>
                          </div>
                          <button type="button" disabled={!isInStock} onClick={() => handleAddToCart(product)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-300/40 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                            <ShoppingCart className="h-4 w-4" /> Add to Cart
                          </button>
                        </div>
                      </article>
                    )
                  })}
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
