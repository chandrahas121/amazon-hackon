import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Banner from './components/Banner'
import ProductFeed from './components/ProductFeed'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OrdersPage from './pages/OrdersPage'
import MyListingsPage from './pages/MyListingsPage'
import SellIt from './components/stitch/SellIt'
import GreenCredits from './components/stitch/GreenCredits'
import HealthCard from './components/stitch/HealthCard'
import api from './api/client'
import { useAuth } from './context/AuthContext'
import { useCart } from './context/CartContext'

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const searchQuery = searchParams.get('q') || ''
  const sourceFilter = searchParams.get('source') || ''

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (sourceFilter) params.set('source', sourceFilter)

    api.get(`/api/listings/?${params.toString()}`)
      .then((res) => {
        const listings = res.data.results || []
        setProducts(listings.map((l) => ({
          id: l.id,
          title: l.product.title,
          price: parseFloat(l.price),
          description: l.condition_summary || l.product.description,
          category: l.product.category,
          image: l.image,
          grade: l.grade,
          source: l.source,
          source_display: l.source_display,
          grade_display: l.grade_display,
          seller_name: l.seller_name,
        })))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [searchQuery, sourceFilter])

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="max-w-screen-2xl mx-auto">
        {!searchQuery && !sourceFilter && <Banner />}
        {(searchQuery || sourceFilter) && (
          <div className="px-3 sm:px-4 pt-3 pb-1">
            <p className="text-xs sm:text-sm text-gray-600">
              {searchQuery && <><span className="font-semibold">Search:</span> "{searchQuery}" </>}
              {sourceFilter && <><span className="font-semibold">Source:</span> {sourceFilter} </>}
              — {loading ? '…' : `${products.length} found`}
            </p>
          </div>
        )}
        <ProductFeed products={products} loading={loading} />
      </main>
    </div>
  )
}

// ─── Product Detail ────────────────────────────────────────────────────────────
const GRADE_STYLE = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  C: 'bg-orange-100 text-orange-800 border-orange-200',
  D: 'bg-red-100 text-red-800 border-red-200',
}

const SOURCE_LABEL = {
  p2p:       'REVIVE – P2P',
  renewed:   'Amazon Renewed',
  warehouse: 'Warehouse Deal',
  return:    'Amazon Return',
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, cart } = useCart()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    api.get(`/api/listings/${id}/`)
      .then((res) => setListing(res.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [id])

  const inCart = cart.some((item) => item.id === parseInt(id))

  const handleAddToCart = () => {
    if (!listing) return
    addToCart({ id: listing.id, title: listing.product.title, price: listing.price, image: listing.image, grade: listing.grade, source: listing.source })
    setAdded(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/5 h-64 sm:h-80 bg-gray-200 rounded-lg" />
            <div className="lg:w-2/5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
            <div className="lg:w-1/5 h-48 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )

  if (notFound || !listing) return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-8 sm:p-10 text-center">
        <p className="text-gray-500 mb-4 text-sm">Listing not found.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-[#febd69] rounded font-semibold text-sm">
          Back to Marketplace
        </button>
      </div>
    </div>
  )

  const product = listing.product

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <button onClick={() => navigate(-1)} className="text-[#007185] hover:underline text-xs sm:text-sm mb-3 sm:mb-4 inline-block">
          ← Back to results
        </button>

        {/*
          Mobile layout:  image (1) → buy box (2) → details (3) → health card (4)
          Desktop layout: image (1) → details (2) → buy box+health card (3)
          Achieved with CSS order utilities.
        */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">

          {/* Image — always first */}
          <div className="lg:w-2/5 order-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex items-center justify-center min-h-[200px] sm:min-h-[280px] lg:min-h-[360px]">
              <img
                src={listing.image}
                alt={product.title}
                className="max-w-full max-h-48 sm:max-h-64 lg:max-h-80 object-contain"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image' }}
              />
            </div>
          </div>

          {/* Buy box — 2nd on mobile, 3rd on desktop */}
          <div className="lg:w-1/5 order-2 lg:order-3 space-y-3 sm:space-y-4">
            {/* Buy box card */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                ₹{parseFloat(listing.price).toLocaleString('en-IN')}
              </div>
              <p className="text-sm text-green-700 font-semibold">In Stock</p>

              {listing.source === 'p2p' && (
                <p className="text-xs text-gray-500 bg-gray-50 border rounded p-2 leading-relaxed">
                  Ships from Amazon Hub after seller drop-off verification
                </p>
              )}

              <button
                onClick={handleAddToCart}
                disabled={inCart || added}
                className={`w-full py-2 sm:py-2.5 rounded text-sm font-bold transition-colors
                  ${inCart || added ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-[#febd69] hover:bg-[#f3a847] text-[#131921]'}`}
              >
                {inCart || added ? 'Added to Cart' : 'Add to Cart'}
              </button>

              <button
                onClick={() => { handleAddToCart(); navigate('/checkout') }}
                disabled={inCart || added}
                className="w-full py-2 sm:py-2.5 rounded text-sm font-bold bg-[#FF9900] hover:bg-[#e88b00] text-white transition-colors"
              >
                Buy Now
              </button>

              <p className="text-xs text-gray-400 text-center">Secure · 7-day returns</p>
            </div>

            {/* Health card — below buy box, full width on mobile */}
            <div className="w-full">
              <HealthCard
                grade={listing.grade}
                conditionSummary={listing.condition_summary}
                completeness={listing.completeness}
                sellerName={listing.seller_name}
              />
            </div>
          </div>

          {/* Product details — 3rd on mobile, 2nd on desktop */}
          <div className="lg:w-2/5 order-3 lg:order-2 space-y-3 sm:space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {listing.source && (
                <span className={`text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full
                  ${listing.source === 'p2p' ? 'bg-[#232F3E] text-[#febd69]' : 'bg-blue-100 text-blue-800'}`}>
                  {SOURCE_LABEL[listing.source] || listing.source_display}
                </span>
              )}
              {listing.grade && (
                <span className={`text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border ${GRADE_STYLE[listing.grade] || ''}`}>
                  {listing.grade_display}
                </span>
              )}
            </div>

            <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-snug">{product.title}</h1>

            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4].map((i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                <span className="text-gray-300 text-sm">★</span>
              </div>
              <span className="text-[#007185] text-xs sm:text-sm cursor-pointer hover:underline">142 ratings</span>
            </div>

            <hr className="border-gray-200" />

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₹{parseFloat(listing.price).toLocaleString('en-IN')}
              </span>
              {product.mrp && parseFloat(product.mrp) > parseFloat(listing.price) && (
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  M.R.P. ₹{parseFloat(product.mrp).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Condition notes */}
            {listing.condition_summary && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">AI Condition Notes</p>
                <p className="text-xs sm:text-sm text-gray-700">{listing.condition_summary}</p>
              </div>
            )}

            {/* Seller */}
            {listing.seller_name && (
              <p className="text-xs sm:text-sm text-gray-600">
                Sold by <span className="text-[#007185] font-semibold">{listing.seller_name}</span> via Amazon Revive
              </p>
            )}

            {product.category && (
              <p className="text-xs text-gray-400">Category: {product.category}</p>
            )}

            {product.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About this item</p>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, removeFromCart, clearCart, cartTotal } = useCart()
  const [redeemedCredits, setRedeemedCredits] = useState(0)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const finalTotal = Math.max(0, cartTotal - redeemedCredits * 0.1)

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return }
    if (cart.length === 0) return
    try {
      setPlacing(true)
      setError('')
      await Promise.all(cart.map((item) => api.post('/api/orders/', { listing_id: item.id })))
      clearCart()
      setSuccess(true)
      setTimeout(() => navigate('/orders'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Some items may no longer be available.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Checkout</h1>

        {success && (
          <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium mb-4 text-sm">
            Order placed! Redirecting to your orders…
          </div>
        )}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">{error}</div>
        )}

        {/* On mobile: order summary comes FIRST (sticky-ish), then cart items */}
        <div className="flex flex-col-reverse lg:flex-row gap-4 sm:gap-6">

          {/* Cart items */}
          <div className="flex-grow min-w-0">
            {cart.length === 0 && !success ? (
              <div className="bg-white rounded-lg shadow-sm p-8 sm:p-10 text-center">
                <p className="text-gray-500 mb-4 text-sm">Your cart is empty.</p>
                <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#febd69] rounded font-bold text-sm">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm divide-y">
                <div className="px-3 sm:px-4 py-3 border-b">
                  <h2 className="font-bold text-gray-800 text-sm sm:text-base">
                    Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
                  </h2>
                </div>
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                      {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-contain" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2">{item.title}</p>
                      {item.grade && <span className="text-[10px] font-bold text-green-700">Grade {item.grade}</span>}
                      <p className="font-bold text-gray-900 mt-1 text-sm">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#007185] hover:underline text-xs self-start flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          {(cart.length > 0 || success) && (
            <div className="lg:w-72 flex-shrink-0 space-y-3 sm:space-y-4">
              <GreenCredits onRedeem={setRedeemedCredits} />

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h2 className="font-bold text-gray-800 text-sm sm:text-base">Order Summary</h2>

                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                {redeemedCredits > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600">
                    <span>Green Credits</span>
                    <span>-₹{(redeemedCredits * 0.1).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-700 font-semibold">FREE</span>
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between font-bold text-gray-900 text-sm sm:text-base">
                  <span>Order Total</span>
                  <span>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || success}
                  className={`w-full py-2.5 sm:py-3 rounded font-bold text-sm transition-colors
                    ${placing || success ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FF9900] hover:bg-[#e88b00] text-white'}`}
                >
                  {placing ? 'Placing Order…' : 'Place Order'}
                </button>
                <p className="text-xs text-gray-400 text-center">Secure checkout · Amazon Pay</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/sell" element={<SellIt />} />
      </Routes>
    </Router>
  )
}

export default App
