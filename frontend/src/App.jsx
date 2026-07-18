import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BadgeCheck, Search, ShoppingCart, Sparkles, Truck, UserCircle, X } from 'lucide-react'

const PRODUCTS_URL = 'http://localhost:5000/api/products'
const ORDERS_URL = 'http://localhost:5000/api/orders'

function formatPrice(value) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return '0'
  }

  return number.toLocaleString('en-LK')
}

function resolveImageUrl(image) {
  const fallbackImage = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80'

  if (!image || image.startsWith('http://example.com')) {
    return fallbackImage
  }

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }

  if (image.startsWith('/')) {
    return `http://localhost:5000${image}`
  }

  return `http://localhost:5000/${image}`
}

function App() {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Cart state
  const [cartItems, setCartItems] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutDetails, setCheckoutDetails] = useState({ customerName: '', phoneNumber: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Admin state
  const [isAdminView, setIsAdminView] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Fetch Products
  useEffect(() => {
    let isMounted = true

    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get(PRODUCTS_URL)
        const nextProducts = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.products)
            ? response.data.products
            : []

        if (isMounted) {
          setProducts(nextProducts)
        }
      } catch (fetchError) {
        console.error('Failed to fetch products from backend:', fetchError)

        if (isMounted) {
          setError('We could not load the latest gift collection right now.')
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch Orders for Admin View
  useEffect(() => {
    if (isAdminView) {
      setOrdersLoading(true)
      axios.get(ORDERS_URL)
        .then(res => setOrders(res.data))
        .catch(err => console.error("Error fetching orders:", err))
        .finally(() => setOrdersLoading(false))
    }
  }, [isAdminView])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    if (!normalizedSearch) {
      return products
    }

    return products.filter((product) => {
      const title = product?.title ?? ''
      const category = product?.category ?? ''
      const description = product?.description ?? ''

      return [title, category, description].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [products, searchQuery])

  const hasProducts = filteredProducts.length > 0
  const totalProducts = products.length
  const inStockCount = products.filter((product) => Number(product?.stock) > 0).length

  // Cart logic
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)

  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product._id === product._id)
      if (existing) {
        return prev.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) {
      alert("Your cart is empty!")
      return
    }
    
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
      console.error("Checkout failed:", error.response?.data || error.message)
      alert(`Checkout failed: ${error.response?.data?.message || 'Please try again.'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,240,217,0.9),_transparent_42%),linear-gradient(180deg,_#fff9f1_0%,_#fff4ea_38%,_#fffdfb_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(255,170,102,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 text-white shadow-lg shadow-orange-300/40">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-500">
                Gift Store
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Malki Gift Center
              </h1>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center lg:justify-end">
            {!isAdminView && (
              <label className="flex w-full items-center gap-3 rounded-full border border-orange-100 bg-white px-4 py-3 shadow-sm shadow-orange-100/60 ring-1 ring-transparent transition focus-within:border-orange-300 focus-within:ring-orange-200 lg:max-w-md">
                <Search className="h-5 w-5 text-orange-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search gifts, baskets, and surprises"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
            )}

            <div className="flex items-center justify-between gap-3 lg:justify-center">
              {!isAdminView && (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-orange-100 bg-white px-4 py-3 shadow-sm shadow-orange-100/60">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Cart</p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ShoppingCart className="h-4 w-4 text-orange-500" />
                        <span>{cartCount} items</span>
                      </div>
                    </div>
                    {cartCount > 0 && (
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="ml-2 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-orange-600 transition"
                      >
                        Checkout
                      </button>
                    )}
                  </div>
                </>
              )}
              <button
                onClick={() => setIsAdminView(!isAdminView)}
                className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                <UserCircle className="h-5 w-5" />
                {isAdminView ? 'Store View' : 'Admin View'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b border-orange-100">
              <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-4">Total: Rs. {formatPrice(cartTotal)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  required
                  type="text"
                  value={checkoutDetails.customerName}
                  onChange={e => setCheckoutDetails({...checkoutDetails, customerName: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <input
                  required
                  type="tel"
                  value={checkoutDetails.phoneNumber}
                  onChange={e => setCheckoutDetails({...checkoutDetails, phoneNumber: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  placeholder="0771234567"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <textarea
                  required
                  rows={3}
                  value={checkoutDetails.address}
                  onChange={e => setCheckoutDetails({...checkoutDetails, address: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none resize-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  placeholder="123 Main St, City"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 font-bold text-white shadow-lg shadow-orange-200 hover:opacity-90 disabled:opacity-70 transition"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {isAdminView ? (
          // --- Admin Dashboard View ---
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur xl:p-10">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Orders Dashboard</h2>
            {ordersLoading ? (
              <p className="text-slate-500">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-500">No orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Customer</th>
                      <th className="px-6 py-4 font-semibold">Phone</th>
                      <th className="px-6 py-4 font-semibold">Address</th>
                      <th className="px-6 py-4 font-semibold">Total Price</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map(order => (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                        <td className="px-6 py-4">{order.phoneNumber}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={order.address}>{order.address}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">Rs. {formatPrice(order.totalPrice)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
                    <h2 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                      Beautiful gifts for birthdays, celebrations, and thoughtful moments.
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                      Explore handpicked surprises from Malki Gift Center. Every product card is pulled
                      straight from your backend, so the storefront stays in sync with your inventory.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-orange-100">
                      <span className="block text-2xl font-black text-slate-950">{totalProducts}</span>
                      Gifts visible
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-orange-100">
                      <span className="block text-2xl font-black text-slate-950">{inStockCount}</span>
                      In stock now
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-orange-100">
                      <span className="block text-2xl font-black text-slate-950">24/7</span>
                      Browse anytime
                    </div>
                  </div>
                </div>

                <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
                  <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-orange-200/70 via-rose-200/70 to-amber-100/70 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white p-4 shadow-2xl shadow-orange-200/40">
                    <img
                      src="https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1200&q=80"
                      alt="Gift arrangement showcase"
                      className="h-72 w-full rounded-[1.5rem] object-cover"
                    />
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                        Featured Collection
                      </p>
                      <p className="text-lg font-bold text-slate-950">
                        Elegant gifting, wrapped with care.
                      </p>
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
                  <p className="mt-2 text-sm text-slate-500">Fetching the latest products from the backend.</p>
                </div>
              ) : error ? (
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
                  <p className="text-lg font-semibold">Could not load products</p>
                  <p className="mt-2 text-sm">{error}</p>
                </div>
              ) : !hasProducts ? (
                <div className="rounded-[2rem] border border-dashed border-orange-200 bg-white/80 p-10 text-center shadow-sm shadow-orange-100">
                  <p className="text-lg font-semibold text-slate-900">No gifts available yet</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add products in the backend to populate the storefront.
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-orange-200 bg-white/80 p-10 text-center shadow-sm shadow-orange-100">
                  <p className="text-lg font-semibold text-slate-900">No gifts matched your search</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Try a different keyword to reveal products from your backend catalog.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const stock = Number(product?.stock) || 0
                    const isInStock = stock > 0

                    return (
                      <article
                        key={product?._id ?? product?.id ?? product?.title}
                        className="group overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={resolveImageUrl(product?.image)}
                            alt={product?.title ?? 'Gift product'}
                            className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80'
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-4 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
                              {product?.category ?? 'Gift'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          <div className="space-y-2">
                            <h3 className="line-clamp-2 text-lg font-bold text-slate-950">
                              {product?.title ?? 'Untitled Product'}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                              {product?.description ?? 'A beautifully curated gift ready for any occasion.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                                Price
                              </span>
                              <p className="text-2xl font-black text-slate-950">
                                Rs. {formatPrice(product?.price)}
                              </p>
                            </div>
                            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {isInStock ? `${stock} in stock` : 'Out of stock'}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!isInStock}
                            onClick={() => handleAddToCart(product)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-300/40 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
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
