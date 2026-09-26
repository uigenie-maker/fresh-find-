import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './style.css';
import './style-ext.css';

/* =========================================================
   1. ASSET HELPER & DATA HOOK
   ========================================================= */
function asset(path) {
  if (!path) return '/images/leaves.jpg';
  const clean = path.replace(/^images\/images\//, 'images/').replace(/^\/+/, '');
  const aliases = {
    'images/empressmarket.jpg': 'images/empress.jpg',
    'images/apple.jpg': 'images/images/apple.jpg',
    'images/tomato.jpg': 'images/images/tomato.jpg',
    'images/spinach.jpg': 'images/images/spinach.jpg',
    'images/carrot.jpg': 'images/images/carrot.jpg',
    'images/strawberry.jpg': 'images/images/strawberry.jpg',
    'images/basil.jpg': 'images/images/basil.jpg',
    'images/mint.jpg': 'images/images/mint.jpg',
    'images/milk.jpg': 'images/images/milk.jpg',
    'images/cheese.jpg': 'images/images/cheese.jpg'
  };
  return '/' + (aliases[clean] || clean);
}

const fallbackData = {
  project: { name: 'FreshFind', city: 'Karachi' },
  markets: [],
  products: []
};

function useData() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data.json:', err);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

/* =========================================================
   2. REAL-TIME CLOCK & STATUS HOOK
   ========================================================= */
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function useRealTimeStatus(markets = []) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDay = DAYS_OF_WEEK[currentTime.getDay()];
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentMinutesTotal = currentHour * 60 + currentMinute;

  const isMarketOpenNow = (market) => {
    if (!market || !market.weeklySchedule) return false;
    const todaySched = market.weeklySchedule[currentDay];
    if (!todaySched || !todaySched.open) return false;

    if (market.openTime && market.closeTime) {
      const [oH, oM] = market.openTime.split(':').map(Number);
      const [cH, cM] = market.closeTime.split(':').map(Number);
      const openTotal = oH * 60 + (oM || 0);
      const closeTotal = cH * 60 + (cM || 0);
      return currentMinutesTotal >= openTotal && currentMinutesTotal < closeTotal;
    }
    return true;
  };

  const openMarkets = markets.filter(isMarketOpenNow);

  return {
    currentTime,
    currentDay,
    currentTimeStr: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    currentDateStr: currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    isMarketOpenNow,
    openMarkets
  };
}

/* =========================================================
   3. BOOKMARKS & PERSONAL NOTES HOOK
   ========================================================= */
function useBookmarks() {
  const [savedMarkets, setSavedMarkets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ff_saved_markets') || '[]');
    } catch {
      return [1, 2];
    }
  });

  const [savedProduce, setSavedProduce] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ff_saved_produce') || '[]');
    } catch {
      return ['apple', 'tomato'];
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ff_personal_notes') || '[]');
    } catch {
      return [
        {
          id: 'note-1',
          itemId: 1,
          itemType: 'market',
          itemTitle: 'Empress Market',
          text: 'Arrive early by 8:30 AM to get the sweetest strawberries and organic basil.',
          updatedAt: '2026-09-26'
        },
        {
          id: 'note-2',
          itemId: 'tomato',
          itemType: 'produce',
          itemTitle: 'Vine Tomatoes',
          text: 'Great for weekend pasta sauce and fresh organic bruschetta.',
          updatedAt: '2026-09-26'
        }
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem('ff_saved_markets', JSON.stringify(savedMarkets));
  }, [savedMarkets]);

  useEffect(() => {
    localStorage.setItem('ff_saved_produce', JSON.stringify(savedProduce));
  }, [savedProduce]);

  useEffect(() => {
    localStorage.setItem('ff_personal_notes', JSON.stringify(notes));
  }, [notes]);

  const toggleMarket = (id) => {
    setSavedMarkets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleProduce = (id) => {
    setSavedProduce((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveNote = (itemId, itemType, itemTitle, text) => {
    setNotes((prev) => {
      const existing = prev.find((n) => n.itemId === itemId && n.itemType === itemType);
      const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      if (existing) {
        return prev.map((n) => (n.id === existing.id ? { ...n, text, updatedAt: dateStr } : n));
      }
      return [
        ...prev,
        {
          id: 'note-' + Date.now(),
          itemId,
          itemType,
          itemTitle,
          text,
          updatedAt: dateStr
        }
      ];
    });
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setSavedMarkets([]);
    setSavedProduce([]);
    setNotes([]);
  };

  return {
    savedMarkets,
    savedProduce,
    notes,
    toggleMarket,
    toggleProduce,
    saveNote,
    deleteNote,
    clearAll,
    totalCount: savedMarkets.length + savedProduce.length
  };
}

/* =========================================================
   4. SIMULATED VISITOR COUNTER & GEOLOCATION
   ========================================================= */
function useVisitorCounter() {
  const [visitorCount, setVisitorCount] = useState(14892);
  const [liveShoppers, setLiveShoppers] = useState(24);

  useEffect(() => {
    const stored = Number(localStorage.getItem('freshFindVisitors') || 14892) + 1;
    localStorage.setItem('freshFindVisitors', stored);
    setVisitorCount(stored);

    const interval = setInterval(() => {
      setLiveShoppers(18 + Math.floor(Math.random() * 15));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return { visitorCount, liveShoppers };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/* =========================================================
   5. NAVIGATION, BREADCRUMBS & RADAR HEADER
   ========================================================= */
function LiveRadarBar({ timeStatus, visitorData }) {
  const { currentDay, currentTimeStr, openMarkets } = timeStatus;
  const { liveShoppers } = visitorData;

  return (
    <div className="live-radar-bar" role="region" aria-label="Real-time Market Radar">
      <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="pulse-dot" />
          <strong className="text-white">Live Market Radar:</strong>
          <span>
            {currentDay}, {currentTimeStr}
          </span>
          <span className="badge bg-success ms-1">
            {openMarkets.length} Market{openMarkets.length === 1 ? '' : 's'} Open Right Now
          </span>
        </div>
        <div className="d-flex align-items-center gap-3 small d-none d-sm-flex">
          <span>
            <i className="bi bi-people-fill text-warning me-1" />
            <strong className="text-white">{liveShoppers}</strong> shoppers browsing now
          </span>
          <span className="text-muted opacity-75">|</span>
          <span className="text-light">📍 Karachi, Pakistan</span>
        </div>
      </div>
    </div>
  );
}

function Navbar({ onLogin, bookmarkCount }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-xl navbar-light bg-white sticky-top" aria-label="Main Navigation">
      <div className="container py-1">
        <Link className="navbar-brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">🌿</span>
          <div className="d-flex flex-column text-start">
            <span style={{ lineHeight: 1.1, fontSize: '1.25rem', letterSpacing: '-0.3px', fontWeight: 700 }}>FRESHFIND</span>
            <small style={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: '#68776f' }}>LOCAL FARMERS MARKETS</small>
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-controls="mainNav"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="mainNav">
          <ul className="navbar-nav ms-auto align-items-xl-center">
            <NavItem to="/" label="Home" icon="house" onClick={() => setMenuOpen(false)} />
            <NavItem to="/market" label="Markets" icon="shop" onClick={() => setMenuOpen(false)} />
            <NavItem to="/product" label="Produce Guide" icon="basket2" onClick={() => setMenuOpen(false)} />
            <li className="nav-item">
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to="/bookmark"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-bookmark-heart me-1" />
                Bookmarks
                {bookmarkCount > 0 && <span className="badge bg-success ms-1 rounded-pill">{bookmarkCount}</span>}
              </NavLink>
            </li>
            <NavItem to="/aboutus" label="About Us" icon="info-circle" onClick={() => setMenuOpen(false)} />
            <NavItem to="/contact" label="Contact" icon="envelope" onClick={() => setMenuOpen(false)} />

            <li className="nav-item">
              <div className="navbar-auth-group">
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => { setMenuOpen(false); onLogin('login'); }}
                  aria-label="Login to FreshFind"
                >
                  <i className="bi bi-box-arrow-in-right me-1" /> Login
                </button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => { setMenuOpen(false); onLogin('signup'); }}
                  aria-label="Create an account on FreshFind"
                >
                  <i className="bi bi-person-plus me-1" /> Sign Up
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, label, icon, onClick }) {
  return (
    <li className="nav-item">
      <NavLink
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        to={to}
        onClick={onClick}
      >
        {icon && <i className={`bi bi-${icon} me-1`} />}
        {label}
      </NavLink>
    </li>
  );
}

function Breadcrumbs({ items }) {
  if (!items || !items.length) return null;
  return (
    <nav aria-label="breadcrumb" className="ff-breadcrumb">
      <Link to="/">
        <i className="bi bi-house-door" /> Home
      </Link>
      {items.map((it, idx) => (
        <React.Fragment key={idx}>
          <span className="divider">/</span>
          {it.link ? <Link to={it.link}>{it.label}</Link> : <span className="current">{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* =========================================================
   6. DUMMY LOGIN / SIGNUP MODAL
   ========================================================= */
function LoginModal({ show, initialTab = 'login', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userRole, setUserRole] = useState('shopper');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setSubmitted(false);
  }, [initialTab, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
    }, 1400);
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.55)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content login-modal shadow-lg border-0">
          <div className="row g-0">
            <div className="col-md-5 login-brand p-4 d-flex flex-column justify-content-between">
              <div>
                <i className="bi bi-leaf fs-1 mb-2 d-inline-block" />
                <h4 className="fw-bold">FreshFind</h4>
                <p className="small opacity-75">Your local community farmers market & seasonal produce hub.</p>
              </div>
              <div className="small border-top border-white-50 pt-2 opacity-75">
                <i className="bi bi-shield-check me-1" /> Client-side secure demo
              </div>
            </div>

            <div className="col-md-7 p-3 p-md-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <ul className="nav nav-pills gap-1">
                  <li className="nav-item">
                    <button
                      className={`btn btn-sm ${tab === 'login' ? 'btn-success' : 'btn-light'}`}
                      onClick={() => setTab('login')}
                    >
                      Sign In
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`btn btn-sm ${tab === 'signup' ? 'btn-success' : 'btn-light'}`}
                      onClick={() => setTab('signup')}
                    >
                      Create Account
                    </button>
                  </li>
                </ul>
                <button className="btn-close" onClick={onClose} aria-label="Close modal" />
              </div>

              {submitted ? (
                <div className="alert alert-success my-4 text-center py-4">
                  <i className="bi bi-check-circle-fill fs-2 d-block mb-2 text-success" />
                  <h6 className="fw-bold">Welcome to FreshFind!</h6>
                  <p className="small mb-0">You have been signed in successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {tab === 'signup' && (
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Sarah Khan"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="you@freshfind.local"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {tab === 'signup' && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">I am joining as:</label>
                      <select
                        className="form-select form-select-sm"
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                      >
                        <option value="shopper">Fresh Food Shopper / Consumer</option>
                        <option value="vendor">Local Farmer / Organic Vendor</option>
                        <option value="community">Market Organizer</option>
                      </select>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-3 small">
                    <label className="form-check-label d-flex align-items-center gap-1">
                      <input type="checkbox" className="form-check-input mt-0" defaultChecked />
                      Remember me
                    </label>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Demo: Use any test password.'); }} className="text-success text-decoration-none">
                      Forgot?
                    </a>
                  </div>

                  <button className="btn btn-success w-100 py-2 mb-2" type="submit">
                    {tab === 'login' ? 'Sign In to FreshFind' : 'Register Account'}
                  </button>

                  <div className="text-center text-muted small mt-2">
                    Or continue with
                    <div className="d-flex justify-content-center gap-2 mt-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleSubmit}>
                        <i className="bi bi-google text-danger me-1" /> Google
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleSubmit}>
                        <i className="bi bi-apple me-1" /> Apple
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   7. AI CHATBOT (Static Rule-Based Dataset)
   ========================================================= */
const CHAT_DATASET = [
  {
    keywords: ['open', 'now', 'today', 'hours', 'time', 'timing'],
    reply: (markets, timeStatus) => {
      const open = markets.filter(timeStatus.isMarketOpenNow);
      if (open.length > 0) {
        return (
          <div>
            <p className="mb-1">
              🟢 Right now, <strong>{open.length} market{open.length > 1 ? 's are' : ' is'} open</strong>:
            </p>
            <ul className="ps-3 mb-2">
              {open.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong> ({m.area}) — {m.schedule}
                </li>
              ))}
            </ul>
            <Link to="/market" className="chat-link">
              View Market Directory →
            </Link>
          </div>
        );
      }
      return (
        <div>
          <p className="mb-1">
            Currently, all markets are closed for today's current hour. Most farmers markets open early morning on{' '}
            <strong>Saturdays & Sundays (7 AM – 2 PM)</strong>.
          </p>
          <Link to="/market" className="chat-link">
            Browse Weekly Schedules →
          </Link>
        </div>
      );
    }
  },
  {
    keywords: ['empress', 'saddar'],
    reply: () => (
      <div>
        <p className="mb-1">
          🏛️ <strong>Empress Market</strong> is located in Saddar, Karachi. Operating on{' '}
          <strong>Sat–Sun (8 AM–2 PM)</strong> and <strong>Wed (8 AM–1 PM)</strong>.
        </p>
        <Link to="/market/1" className="chat-link">
          Open Empress Market Page →
        </Link>
      </div>
    )
  },
  {
    keywords: ['riverside', 'clifton'],
    reply: () => (
      <div>
        <p className="mb-1">
          🌊 <strong>Riverside Farmers Market</strong> is located along Clifton Marine Promenade. Open{' '}
          <strong>Fri–Sun (7 AM–1 PM)</strong> with artisanal dairy, cheeses, and organic greens.
        </p>
        <Link to="/market/2" className="chat-link">
          Open Riverside Market Page →
        </Link>
      </div>
    )
  },
  {
    keywords: ['sunrise', 'dha'],
    reply: () => (
      <div>
        <p className="mb-1">
          ☀️ <strong>Sunrise Farmers Market</strong> is situated in DHA Phase 5. Operating{' '}
          <strong>Sat–Sun (7 AM–1 PM)</strong> and <strong>Tue (7 AM–11 AM)</strong>.
        </p>
        <Link to="/market/3" className="chat-link">
          Open Sunrise Market Page →
        </Link>
      </div>
    )
  },
  {
    keywords: ['green valley', 'nazimabad', 'north nazimabad'],
    reply: () => (
      <div>
        <p className="mb-1">
          🌿 <strong>Green Valley Organic Market</strong> is in North Nazimabad (Block H). Operating{' '}
          <strong>Tue, Thu, Sat (8 AM–2 PM)</strong>.
        </p>
        <Link to="/market/4" className="chat-link">
          Open Green Valley Page →
        </Link>
      </div>
    )
  },
  {
    keywords: ['gulshan', 'agro'],
    reply: () => (
      <div>
        <p className="mb-1">
          🌽 <strong>Gulshan Agro Fresh Market</strong> is located on University Road, Gulshan-e-Iqbal. Operating{' '}
          <strong>Mon, Wed, Fri, Sat (9 AM–3 PM)</strong>.
        </p>
        <Link to="/market/5" className="chat-link">
          Open Gulshan Market Page →
        </Link>
      </div>
    )
  },
  {
    keywords: ['strawberry', 'strawberries', 'berry', 'berries'],
    reply: () => (
      <div>
        <p className="mb-1">
          🍓 Fresh field strawberries are currently in season during <strong>Winter & Spring</strong>! Found at{' '}
          <strong>Empress Market</strong>, <strong>Sunrise Market</strong>, and <strong>Bahria Community Harvest</strong>.
        </p>
        <Link to="/product" className="chat-link">
          View in Produce Guide →
        </Link>
      </div>
    )
  },
  {
    keywords: ['tomato', 'tomatoes'],
    reply: () => (
      <div>
        <p className="mb-1">
          🍅 <strong>Vine-Ripened Tomatoes</strong> are available year-round at Empress Market, Riverside Market, and Gulshan Agro Market.
        </p>
        <Link to="/product" className="chat-link">
          Check Tomatoes in Produce Guide →
        </Link>
      </div>
    )
  },
  {
    keywords: ['milk', 'dairy', 'cheese'],
    reply: () => (
      <div>
        <p className="mb-1">
          🧀 Farm-fresh unpasteurized milk and artisanal cheeses are supplied at <strong>Riverside Market</strong>,{' '}
          <strong>Green Valley</strong>, and <strong>Bahria Community Harvest</strong>.
        </p>
        <Link to="/product" className="chat-link">
          Explore Dairy Products →
        </Link>
      </div>
    )
  },
  {
    keywords: ['herb', 'herbs', 'mint', 'basil'],
    reply: () => (
      <div>
        <p className="mb-1">
          🌿 Fresh sweet basil and invigorating garden mint are featured at <strong>Empress Market</strong>,{' '}
          <strong>Riverside</strong>, and <strong>Green Valley</strong>.
        </p>
        <Link to="/product" className="chat-link">
          Explore Herbs & Greens →
        </Link>
      </div>
    )
  },
  {
    keywords: ['bookmark', 'save', 'favorite', 'note', 'notes', 'export'],
    reply: () => (
      <div>
        <p className="mb-1">
          ⭐ You can bookmark any market or produce item using the heart icon! On the <strong>Bookmarks</strong> page, you
          can also write personal shopping notes, export your list as a text file, and share it via WhatsApp.
        </p>
        <Link to="/bookmark" className="chat-link">
          Open My Bookmarks →
        </Link>
      </div>
    )
  },
  {
    keywords: ['contact', 'email', 'phone', 'address', 'support', 'help', 'location'],
    reply: () => (
      <div>
        <p className="mb-1">
          📞 You can contact the FreshFind team at <strong>support@freshfind.com</strong> or call{' '}
          <strong>+92 334 376 590</strong>.
        </p>
        <Link to="/contact" className="chat-link">
          Go to Contact Page →
        </Link>
      </div>
    )
  }
];

function ChatBot({ data, timeStatus }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hi there! 🌿 I am your FreshFind virtual assistant. Ask me about open markets, produce seasons, or schedules!'
    }
  ]);

  const handleSend = (text) => {
    const q = (text || input).trim();
    if (!q) return;

    const userMsg = { type: 'user', content: q };
    const qLower = q.toLowerCase();

    let botResponse = null;
    for (const rule of CHAT_DATASET) {
      if (rule.keywords.some((k) => qLower.includes(k))) {
        botResponse = rule.reply(data.markets, timeStatus);
        break;
      }
    }

    if (!botResponse) {
      if (qLower.includes('hi') || qLower.includes('hello') || qLower.includes('hey')) {
        botResponse = (
          <div>
            <p className="mb-1">Hello! How can I assist your fresh food market journey today?</p>
            <div className="d-flex flex-wrap gap-1 mt-1">
              <button className="chat-quick-btn" onClick={() => handleSend("What's open today?")}>
                Open Today?
              </button>
              <button className="chat-quick-btn" onClick={() => handleSend('Tell me about Empress Market')}>
                Empress Market
              </button>
            </div>
          </div>
        );
      } else {
        botResponse = (
          <div>
            <p className="mb-1">
              I can help you find farmers markets, check operating hours, browse seasonal produce, and manage bookmarks.
            </p>
            <div className="d-flex flex-wrap gap-1">
              <Link to="/market" className="chat-link">Market Directory</Link>
              <Link to="/product" className="chat-link">Produce Guide</Link>
              <Link to="/contact" className="chat-link">Contact Team</Link>
            </div>
          </div>
        );
      }
    }

    setMessages((prev) => [...prev, userMsg, { type: 'bot', content: botResponse }]);
    setInput('');
  };

  return (
    <>
      <button
        className="chat-button"
        onClick={() => setOpen(!open)}
        aria-label="Open FreshFind Support Chatbot"
        title="Open Support Chat"
      >
        <i className={open ? 'bi bi-x-lg' : 'bi bi-chat-dots-fill'} />
      </button>

      {open && (
        <aside className="chat-box show" aria-label="Customer Support Chat">
          <div className="chat-header">
            <div className="d-flex align-items-center gap-2">
              <span className="brand-mark bg-white text-success" style={{ width: 28, height: 28, fontSize: '0.9rem' }}>
                🌿
              </span>
              <div>
                <div style={{ fontSize: '0.92rem' }}>FreshFind Assistant</div>
                <small style={{ fontSize: '0.7rem', opacity: 0.85 }}>Rule-based AI • Always Online</small>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat window">&times;</button>
          </div>

          <div className="chat-messages" tabIndex="0" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.type}`}>
                {typeof m.content === 'string' ? m.content : m.content}
              </div>
            ))}
          </div>

          <div className="chat-quick" aria-label="Quick suggested replies">
            <button className="chat-quick-btn" onClick={() => handleSend("What's open right now?")}>🟢 Open Right Now?</button>
            <button className="chat-quick-btn" onClick={() => handleSend('Where can I find strawberries?')}>🍓 Strawberries</button>
            <button className="chat-quick-btn" onClick={() => handleSend('Empress Market schedule')}>Empress Market</button>
            <button className="chat-quick-btn" onClick={() => handleSend('How do I save bookmarks?')}>Bookmarks & Notes</button>
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about markets or produce..."
              aria-label="Type your message"
            />
            <button type="submit" aria-label="Send message">
              <i className="bi bi-send-fill" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}

/* =========================================================
   8. FOOTER COMPONENT
   ========================================================= */
function Footer({ visitorCount, liveShoppers }) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="brand-mark">🌿</span>
              <h5 className="fw-bold mb-0 text-white">FreshFind</h5>
            </div>
            <p className="text-muted small">
              Connecting urban communities with certified farmers markets, organic growers, and seasonal harvest guides
              in Karachi, Pakistan.
            </p>
            <div className="visitor-pill mt-2">
              <i className="bi bi-eye-fill text-success" />
              <span>
                Total Visits: <strong>{visitorCount.toLocaleString()}</strong>
              </span>
              <span className="opacity-50">|</span>
              <span className="text-warning">
                <strong>{liveShoppers}</strong> online
              </span>
            </div>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-white mb-3">Explore</h6>
            <Link to="/">Home</Link>
            <Link to="/market">Market Directory</Link>
            <Link to="/product">Produce Guide</Link>
            <Link to="/bookmark">My Bookmarks</Link>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-white mb-3">Quick Markets</h6>
            <Link to="/market/1">Empress Market</Link>
            <Link to="/market/2">Riverside Clifton</Link>
            <Link to="/market/3">Sunrise DHA</Link>
            <Link to="/market/4">Green Valley</Link>
          </div>

          <div className="col-lg-4">
            <h6 className="fw-bold text-white mb-3">About FreshFind Platform</h6>
            <p className="text-muted small mb-2">
              Built with React.js & Vite. Complies with lightweight zero-server client storage architecture.
            </p>
            <div className="d-flex gap-3 mt-3">
              <Link to="/aboutus" className="btn btn-sm btn-outline-success">About Our Mission</Link>
              <Link to="/contact" className="btn btn-sm btn-success">Contact Support</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-top border-white-10 py-3 text-center small text-muted">
        © 2026 FreshFind Platform. Developed with care for local communities. All rights reserved.
      </div>
    </footer>
  );
}

/* =========================================================
   9. HOME PAGE (Search, Prominent Filter, Rotating Showcase)
   ========================================================= */
function Home({ data, timeStatus, bookmarks }) {
  const navigate = useNavigate();
  const [filterArea, setFilterArea] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [filterProduce, setFilterProduce] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [showcaseTab, setShowcaseTab] = useState('openNow');

  const areas = ['all', 'Saddar', 'Clifton', 'DHA', 'North Nazimabad', 'Gulshan-e-Iqbal', 'Malir'];
  const days = ['all', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const produceTypes = ['all', 'Fruits', 'Vegetables', 'Herbs', 'Dairy'];

  const handleHomeSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterArea !== 'all') params.set('area', filterArea);
    if (filterDay !== 'all') params.set('day', filterDay);
    if (filterProduce !== 'all') params.set('produce', filterProduce);
    if (searchWord.trim()) params.set('q', searchWord.trim());
    navigate(`/market?${params.toString()}`);
  };

  const matchingMarkets = data.markets.filter((m) => {
    const matchArea = filterArea === 'all' || m.area.toLowerCase() === filterArea.toLowerCase();
    const matchDay = filterDay === 'all' || (m.operatingDays && m.operatingDays.includes(filterDay));
    const matchProduce =
      filterProduce === 'all' || (m.produce && m.produce.some((p) => p.toLowerCase() === filterProduce.toLowerCase()));
    const matchQuery =
      !searchWord.trim() ||
      (m.name + ' ' + m.area + ' ' + m.description).toLowerCase().includes(searchWord.toLowerCase());
    return matchArea && matchDay && matchProduce && matchQuery;
  });

  return (
    <>
      {/* Hero Header */}
      <header className="hero-home" role="banner">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="hero-kicker">
                <i className="bi bi-leaf-fill" /> Fresh • Organic • Direct From Growers
              </span>
              <h1 className="fw-bold mt-3">Fresh finds are closer than you think.</h1>
              <p className="lead mt-3">
                Discover local farmers markets across Karachi, check real-time operating hours, explore seasonal produce,
                and plan your next wholesome shopping trip.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/market" className="btn btn-light btn-lg px-4 text-success fw-bold">
                  Browse All Markets <i className="bi bi-arrow-right ms-1" />
                </Link>
                <Link to="/product" className="btn btn-outline-light btn-lg px-4">
                  Explore Produce Guide
                </Link>
              </div>

              <div className="row g-2 mt-4">
                <Stat n={`${data.markets.length || 6}+`} t="Farmers Markets" />
                <Stat n={`${data.products.length || 9}+`} t="Seasonal Foods" />
                <Stat n={`${timeStatus.openMarkets.length} Open`} t="Right Now" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Prominent Search & Filter Panel (Requirement 2) */}
      <section className="container" aria-label="Find a Market Search">
        <div className="home-search-panel">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <div>
              <span className="badge bg-success-subtle text-success fw-bold px-3 py-1 mb-1">PROMINENT SEARCH</span>
              <h4 className="fw-bold mb-0">Find a Farmers Market Near You</h4>
            </div>
            <span className="text-muted small">
              <i className="bi bi-geo-alt text-success me-1" /> Showing Karachi Regional Markets
            </span>
          </div>

          <form onSubmit={handleHomeSearch}>
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label small fw-semibold text-muted">Area / Neighborhood</label>
                <select
                  className="form-select"
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  aria-label="Filter by Area"
                >
                  {areas.map((a) => (
                    <option key={a} value={a}>{a === 'all' ? 'All Areas' : a}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label small fw-semibold text-muted">Day of Week</label>
                <select
                  className="form-select"
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  aria-label="Filter by Day of Week"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>{d === 'all' ? 'Any Day of Week' : d}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label small fw-semibold text-muted">Produce Type</label>
                <select
                  className="form-select"
                  value={filterProduce}
                  onChange={(e) => setFilterProduce(e.target.value)}
                  aria-label="Filter by Produce Type"
                >
                  {produceTypes.map((p) => (
                    <option key={p} value={p}>{p === 'all' ? 'All Produce Types' : p}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label small fw-semibold text-muted">Keyword</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Empress, Cheese, Herbs..."
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  aria-label="Search keyword"
                />
              </div>

              <div className="col-12 d-flex flex-wrap justify-content-between align-items-center mt-3 pt-2 border-top gap-2">
                <span className="text-muted small">
                  <strong>{matchingMarkets.length}</strong> market{matchingMarkets.length === 1 ? '' : 's'} match your criteria
                </span>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setFilterArea('all');
                      setFilterDay('all');
                      setFilterProduce('all');
                      setSearchWord('');
                    }}
                  >
                    Reset
                  </button>
                  <button type="submit" className="btn btn-success px-4">
                    <i className="bi bi-search me-1" /> Search Markets ({matchingMarkets.length})
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Featured / Rotating Showcase (Requirement 3) */}
      <section className="container py-5" aria-label="Market Showcase">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <div className="section-kicker">Interactive Showcase</div>
            <h2 className="section-title mb-0">Featured Markets & Seasonal Picks</h2>
          </div>

          <div className="showcase-tabs-container" role="tablist">
            <button
              className={`showcase-tab-btn ${showcaseTab === 'openNow' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('openNow')}
              role="tab"
              aria-selected={showcaseTab === 'openNow'}
            >
              🟢 Open Right Now ({timeStatus.openMarkets.length})
            </button>
            <button
              className={`showcase-tab-btn ${showcaseTab === 'featured' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('featured')}
              role="tab"
              aria-selected={showcaseTab === 'featured'}
            >
              ⭐ Featured Markets
            </button>
            <button
              className={`showcase-tab-btn ${showcaseTab === 'seasonal' ? 'active' : ''}`}
              onClick={() => setShowcaseTab('seasonal')}
              role="tab"
              aria-selected={showcaseTab === 'seasonal'}
            >
              🍂 Seasonal Picks
            </button>
          </div>
        </div>

        {/* Tab 1: Open Right Now */}
        {showcaseTab === 'openNow' && (
          <div>
            {timeStatus.openMarkets.length === 0 ? (
              <div className="card p-5 text-center bg-white border-0 shadow-sm rounded-4">
                <i className="bi bi-clock-history text-muted fs-1 mb-2" />
                <h5 className="fw-bold">No Markets Open at this Exact Minute</h5>
                <p className="text-muted mb-3">
                  Today is {timeStatus.currentDay} ({timeStatus.currentTimeStr}). Most morning farmers markets operate on
                  weekends between 7:00 AM and 2:00 PM.
                </p>
                <div>
                  <button className="btn btn-success px-4" onClick={() => setShowcaseTab('featured')}>
                    View All Featured Markets
                  </button>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                {timeStatus.openMarkets.map((m) => (
                  <MarketCardItem
                    key={m.id}
                    market={m}
                    isOpen={true}
                    isSaved={bookmarks.savedMarkets.includes(m.id)}
                    onToggleSave={() => bookmarks.toggleMarket(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Featured Markets */}
        {showcaseTab === 'featured' && (
          <div className="row g-4">
            {data.markets.slice(0, 3).map((m) => (
              <MarketCardItem
                key={m.id}
                market={m}
                isOpen={timeStatus.isMarketOpenNow(m)}
                isSaved={bookmarks.savedMarkets.includes(m.id)}
                onToggleSave={() => bookmarks.toggleMarket(m.id)}
              />
            ))}
          </div>
        )}

        {/* Tab 3: Seasonal Picks */}
        {showcaseTab === 'seasonal' && (
          <div className="row g-4">
            {data.products.slice(0, 3).map((p) => (
              <div className="col-md-6 col-lg-4" key={p.id}>
                <div className="card product-card shadow-sm h-100">
                  <div className="product-image position-relative">
                    <img src={asset(p.image)} alt={p.name} />
                    <span className="card-tag">
                      <i className="bi bi-calendar3 me-1" />
                      {p.season}
                    </span>
                  </div>
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-0">{p.name}</h5>
                      <img src={asset(p.icon)} alt="" style={{ width: 26, height: 26 }} />
                    </div>
                    <span className="badge-category mb-2 align-self-start">{p.category}</span>
                    <p className="text-muted small mb-3">{p.description}</p>
                    <div className="mt-auto d-flex gap-2">
                      <Link to="/product" className="btn btn-outline-success btn-sm flex-grow-1">
                        Explore in Guide
                      </Link>
                      <button
                        className={`btn btn-sm ${bookmarks.savedProduce.includes(p.id) ? 'btn-success' : 'btn-outline-secondary'}`}
                        onClick={() => bookmarks.toggleProduce(p.id)}
                        aria-label="Bookmark produce"
                      >
                        <i className={`bi bi-heart${bookmarks.savedProduce.includes(p.id) ? '-fill' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Farming Value Section */}
      <section className="container py-4">
        <div className="row g-4 align-items-center">
          <div className="col-lg-6">
            <div className="section-kicker">COMMUNITY FARMING</div>
            <h2 className="section-title mb-3">Fresh food direct from smallholder growers</h2>
            <p className="text-muted">
              By visiting your neighborhood farmers market, you support local growers, reduce transit packaging, and bring home nutrient-dense seasonal produce.
            </p>
            <div className="d-flex flex-column gap-3 mt-4">
              <Info icon="shield-check" title="Quality Guaranteed" text="Vendors harvest early morning to ensure maximum crunch, nutrition and natural flavor." />
              <Info icon="clock" title="Verified Operating Hours" text="Never arrive to closed gates—our live radar checks operating schedules before you set off." />
              <Info icon="bookmark-check" title="Personal Market List" text="Bookmark favorite stalls, record shopping notes, and export your list easily." />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card border-0 rounded-4 overflow-hidden shadow">
              <img src="/images/hero.jpg" alt="Vibrant farmers market stalls" style={{ height: 400, objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ n, t }) {
  return (
    <div className="col-4 col-sm-3">
      <div className="hero-stat">
        <strong>{n}</strong>
        <span>{t}</span>
      </div>
    </div>
  );
}

function Info({ icon, title, text }) {
  return (
    <div className="stat-card d-flex gap-3 align-items-center">
      <div className="icon-box">
        <i className={`bi bi-${icon}`} />
      </div>
      <div>
        <h6 className="fw-bold mb-1">{title}</h6>
        <p className="small text-muted mb-0">{text}</p>
      </div>
    </div>
  );
}

function MarketCardItem({ market, isOpen, isSaved, onToggleSave }) {
  return (
    <div className="col-md-6 col-lg-4">
      <div className="card market-card h-100 shadow-sm border-0 position-relative">
        <div className="position-relative">
          <img className="card-img-top" src={asset(market.image)} alt={market.name} />
          <span className="card-tag">
            <i className="bi bi-geo-alt-fill me-1" />
            {market.area}
          </span>
          <button
            className={`btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle ${isSaved ? 'btn-danger' : 'btn-light'}`}
            style={{ width: 36, height: 36, padding: 0 }}
            onClick={onToggleSave}
            aria-label={isSaved ? 'Remove from bookmarks' : 'Add to bookmarks'}
          >
            <i className={`bi bi-heart${isSaved ? '-fill' : ''}`} />
          </button>
        </div>

        <div className="card-body p-4 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold mb-0">{market.name}</h5>
            {isOpen ? (
              <span className="badge-open-now">
                <span className="pulse-dot" style={{ width: 6, height: 6 }} /> Open Now
              </span>
            ) : (
              <span className="badge-closed">Closed</span>
            )}
          </div>

          <p className="text-muted small mb-2">
            <i className="bi bi-geo-alt text-success me-1" />
            {market.area}, {market.city} • <span className="text-dark fw-semibold">{market.distance}</span>
          </p>

          <p className="text-muted small mb-2">
            <i className="bi bi-clock text-success me-1" />
            {market.schedule}
          </p>

          <p className="text-muted small mb-3 flex-grow-1" style={{ fontSize: '0.84rem' }}>
            {market.description}
          </p>

          <div className="mb-3">
            {market.produce.map((p) => (
              <span className="badge tag-badge me-1" key={p}>
                {p}
              </span>
            ))}
          </div>

          <div className="mt-auto">
            <Link to={`/market/${market.id}`} className="btn btn-success w-100">
              View Market Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   10. MARKET DIRECTORY PAGE (Filtering, Sorting, Proximity)
   ========================================================= */
function MarketDirectory({ data, timeStatus, bookmarks }) {
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [areaFilter, setAreaFilter] = useState(searchParams.get('area') || 'all');
  const [dayFilter, setDayFilter] = useState(searchParams.get('day') || 'all');
  const [produceFilter, setProduceFilter] = useState(searchParams.get('produce') || 'all');
  const [sortBy, setSortBy] = useState('alphabetical');

  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('proximity');
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not access your live location. Using default regional distances.');
        setLocating(false);
      }
    );
  };

  const areas = ['all', 'Saddar', 'Clifton', 'DHA', 'North Nazimabad', 'Gulshan-e-Iqbal', 'Malir'];
  const days = ['all', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const produces = ['all', 'Fruits', 'Vegetables', 'Herbs', 'Dairy'];

  const filtered = useMemo(() => {
    return data.markets.filter((m) => {
      const matchQuery =
        !q.trim() ||
        (m.name + ' ' + m.area + ' ' + m.description + ' ' + m.produce.join(' '))
          .toLowerCase()
          .includes(q.toLowerCase());
      const matchArea = areaFilter === 'all' || m.area.toLowerCase() === areaFilter.toLowerCase();
      const matchDay = dayFilter === 'all' || (m.operatingDays && m.operatingDays.includes(dayFilter));
      const matchProduce =
        produceFilter === 'all' ||
        (m.produce && m.produce.some((p) => p.toLowerCase() === produceFilter.toLowerCase()));
      return matchQuery && matchArea && matchDay && matchProduce;
    });
  }, [data.markets, q, areaFilter, dayFilter, produceFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === 'alphabetical') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'alphabetical-desc') {
      return list.sort((a, b) => b.name.localeCompare(a.name));
    }
    if (sortBy === 'proximity') {
      return list.sort((a, b) => {
        const distA = userLocation
          ? calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng)
          : a.distanceKm || 0;
        const distB = userLocation
          ? calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
          : b.distanceKm || 0;
        return distA - distB;
      });
    }
    if (sortBy === 'opennow') {
      return list.sort((a, b) => {
        const openA = timeStatus.isMarketOpenNow(a) ? 1 : 0;
        const openB = timeStatus.isMarketOpenNow(b) ? 1 : 0;
        return openB - openA;
      });
    }
    return list;
  }, [filtered, sortBy, userLocation, timeStatus]);

  return (
    <main className="page-wrap">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Farmers Market Directory' }]} />

        <div className="page-hero p-4 p-md-5 mb-4">
          <div>
            <span className="badge bg-light text-success mb-2 px-3 py-1 fw-bold">MARKET DIRECTORY</span>
            <h1 className="display-5 fw-bold text-white">Karachi Farmers Markets</h1>
            <p className="lead mb-0 text-white-50">
              Filter by neighborhood, open days, or produce type. Check live schedules before leaving.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* Filter Sidebar */}
          <aside className="col-lg-3" aria-label="Market directory filters">
            <div className="card p-3 filter-card shadow-sm">
              <h5 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                <span>Filter Markets</span>
                <span className="badge bg-success-subtle text-success small">{sorted.length} Found</span>
              </h5>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Search Keyword</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Search name, area..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search markets by name or area"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Neighborhood</label>
                <select
                  className="form-select form-select-sm"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  aria-label="Select Area"
                >
                  {areas.map((a) => (
                    <option key={a} value={a}>{a === 'all' ? 'All Areas' : a}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Operating Day</label>
                <select
                  className="form-select form-select-sm"
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  aria-label="Select Day of Week"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>{d === 'all' ? 'Any Day' : d}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Produce Category</label>
                <div className="filter-category-grid">
                  {produces.map((p) => (
                    <button
                      key={p}
                      className={`filter-category-btn ${produceFilter === p ? 'active' : ''}`}
                      onClick={() => setProduceFilter(p)}
                    >
                      {p === 'all' ? 'All' : p}
                    </button>
                  ))}
                </div>
              </div>

              <hr />

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Proximity Radar</label>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                  onClick={handleDetectLocation}
                  disabled={locating}
                >
                  <i className="bi bi-crosshair" />
                  {locating ? 'Detecting Location...' : userLocation ? 'Location Active ✓' : 'Find Nearest to Me'}
                </button>
                {userLocation && (
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                    Distances calibrated from your current coordinates.
                  </small>
                )}
              </div>

              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setQ('');
                  setAreaFilter('all');
                  setDayFilter('all');
                  setProduceFilter('all');
                  setSortBy('alphabetical');
                  setUserLocation(null);
                }}
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Directory Listings */}
          <section className="col-lg-9" aria-label="Market directory cards">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-3 border gap-2">
              <span className="text-muted small">
                Showing <strong>{sorted.length}</strong> of {data.markets.length} Farmers Markets
              </span>

              <div className="d-flex align-items-center gap-2">
                <label htmlFor="sortSelect" className="small fw-semibold text-muted text-nowrap">
                  Sort By:
                </label>
                <select
                  id="sortSelect"
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: 'auto' }}
                  aria-label="Sort markets by"
                >
                  <option value="alphabetical">Alphabetical (A - Z)</option>
                  <option value="alphabetical-desc">Alphabetical (Z - A)</option>
                  <option value="proximity">Proximity (Nearest First)</option>
                  <option value="opennow">Currently Open First</option>
                </select>
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="card p-5 text-center bg-white border-0 shadow-sm rounded-4">
                <i className="bi bi-search text-muted fs-1 mb-3" />
                <h5 className="fw-bold">No Markets Match Your Selection</h5>
                <p className="text-muted">Try resetting your filters or searching for another neighborhood.</p>
                <button
                  className="btn btn-success align-self-center px-4"
                  onClick={() => {
                    setQ('');
                    setAreaFilter('all');
                    setDayFilter('all');
                    setProduceFilter('all');
                  }}
                >
                  Show All Markets
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {sorted.map((m) => {
                  const distDisplay = userLocation
                    ? `${calculateDistance(userLocation.lat, userLocation.lng, m.lat, m.lng)} km (from you)`
                    : m.distance;

                  return (
                    <div className="col-md-6" key={m.id}>
                      <div className="card market-card h-100 shadow-sm border-0 position-relative">
                        <div className="position-relative">
                          <img className="card-img-top" src={asset(m.image)} alt={m.name} />
                          <span className="card-tag">
                            <i className="bi bi-geo-alt-fill me-1" />
                            {m.area}
                          </span>
                          <button
                            className={`btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle ${bookmarks.savedMarkets.includes(m.id) ? 'btn-danger' : 'btn-light'}`}
                            style={{ width: 36, height: 36, padding: 0 }}
                            onClick={() => bookmarks.toggleMarket(m.id)}
                            aria-label={bookmarks.savedMarkets.includes(m.id) ? 'Remove bookmark' : 'Bookmark market'}
                          >
                            <i className={`bi bi-heart${bookmarks.savedMarkets.includes(m.id) ? '-fill' : ''}`} />
                          </button>
                        </div>

                        <div className="card-body p-4 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="fw-bold mb-0">{m.name}</h5>
                            {timeStatus.isMarketOpenNow(m) ? (
                              <span className="badge-open-now">
                                <span className="pulse-dot" style={{ width: 6, height: 6 }} /> Open Now
                              </span>
                            ) : (
                              <span className="badge-closed">Closed</span>
                            )}
                          </div>

                          <p className="text-muted small mb-2">
                            <i className="bi bi-geo-alt text-success me-1" />
                            {m.address} • <span className="fw-bold text-dark">{distDisplay}</span>
                          </p>

                          <p className="text-muted small mb-2">
                            <i className="bi bi-clock text-success me-1" />
                            {m.schedule}
                          </p>

                          <p className="text-muted small mb-3 flex-grow-1" style={{ fontSize: '0.84rem' }}>
                            {m.description}
                          </p>

                          <div className="mb-3">
                            {m.produce.map((p) => (
                              <span className="badge tag-badge me-1" key={p}>
                                {p}
                              </span>
                            ))}
                          </div>

                          <div className="mt-auto">
                            <Link to={`/market/${m.id}`} className="btn btn-success w-100">
                              View Schedule & Products →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   11. MARKET DETAIL PAGE (Weekly Table, Map, Produce Grid)
   ========================================================= */
function MarketDetail({ data, timeStatus, bookmarks }) {
  const { id } = useParams();
  const market = data.markets.find((m) => String(m.id) === String(id)) || data.markets[0];

  if (!market) {
    return (
      <div className="container py-5 text-center">
        <h2>Market Not Found</h2>
        <Link to="/market" className="btn btn-success mt-3">Back to Directory</Link>
      </div>
    );
  }

  const isOpen = timeStatus.isMarketOpenNow(market);
  const isSaved = bookmarks.savedMarkets.includes(market.id);

  const marketProducts = data.products.filter(
    (p) => market.productIds && market.productIds.includes(p.id)
  );

  return (
    <main className="page-wrap">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Markets', link: '/market' },
            { label: market.name }
          ]}
        />

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
          <div className="row g-0">
            <div className="col-lg-6 position-relative">
              <img
                src={asset(market.image)}
                alt={market.name}
                style={{ width: '100%', height: '100%', minHeight: 320, objectFit: 'cover' }}
              />
              <span className="card-tag">
                <i className="bi bi-geo-alt-fill me-1" /> {market.area}
              </span>
            </div>

            <div className="col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  {isOpen ? (
                    <span className="badge-open-now">
                      <span className="pulse-dot" style={{ width: 6, height: 6 }} /> Open Right Now
                    </span>
                  ) : (
                    <span className="badge-closed">Currently Closed</span>
                  )}
                  <span className="badge bg-warning-subtle text-warning-emphasis fw-bold">
                    ★ {market.rating || '4.8'} ({market.reviewsCount || 85} reviews)
                  </span>
                </div>

                <h1 className="fw-bold mb-2">{market.name}</h1>
                <p className="text-muted small mb-3">
                  <i className="bi bi-geo-alt-fill text-success me-1" /> {market.address}
                </p>
                <p className="text-muted">{market.description}</p>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="p-2 border rounded-3 bg-light">
                      <small className="text-muted d-block">Operating Hours</small>
                      <strong className="small">{market.schedule}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded-3 bg-light">
                      <small className="text-muted d-block">Contact Phone</small>
                      <strong className="small">{market.contactPhone || '+92 21 3568 2211'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 pt-3 border-top">
                <button
                  className={`btn ${isSaved ? 'btn-danger' : 'btn-success'} flex-grow-1`}
                  onClick={() => bookmarks.toggleMarket(market.id)}
                >
                  <i className={`bi bi-heart${isSaved ? '-fill' : ''} me-1`} />
                  {isSaved ? 'Bookmarked' : 'Add to My Bookmarks'}
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-success"
                >
                  <i className="bi bi-signpost-2 me-1" /> Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card p-4 border-0 shadow-sm rounded-4 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">
                  <i className="bi bi-calendar-week text-success me-2" />
                  Weekly Operating Schedule
                </h4>
                <span className="badge bg-light text-muted">Weekly Roster</span>
              </div>
              <p className="text-muted small mb-3">
                Highlighted row indicates today's schedule based on live system clock ({timeStatus.currentDay}).
              </p>

              <div className="table-responsive">
                <table className="schedule-table" aria-label="Weekly Operating Schedule">
                  <thead>
                    <tr>
                      <th scope="col">Day</th>
                      <th scope="col">Status</th>
                      <th scope="col">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_OF_WEEK.map((day) => {
                      const sched = market.weeklySchedule ? market.weeklySchedule[day] : null;
                      const isToday = day === timeStatus.currentDay;
                      const isOpenOnDay = sched && sched.open;

                      return (
                        <tr key={day} className={isToday ? 'today-row' : ''}>
                          <td>
                            <strong>{day}</strong> {isToday && <span className="badge bg-success ms-1">Today</span>}
                          </td>
                          <td>
                            {isOpenOnDay ? (
                              <span className="text-success fw-bold">Open</span>
                            ) : (
                              <span className="text-muted">Closed</span>
                            )}
                          </td>
                          <td>{sched ? sched.hours : 'Closed'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card p-4 border-0 shadow-sm rounded-4 h-100 bg-white">
              <h4 className="fw-bold mb-2">
                <i className="bi bi-map text-success me-2" />
                Market Location Map
              </h4>
              <p className="text-muted small mb-3">
                Interactive embedded map of {market.name} located in {market.area}, Karachi.
              </p>
              <iframe
                title={`Map location of ${market.name}`}
                src={market.mapUrl}
                className="map-frame"
                loading="lazy"
                style={{ height: 310, border: 0, borderRadius: 14 }}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="card p-4 border-0 shadow-sm rounded-4 bg-white mt-2">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-bold mb-0">
                    <i className="bi bi-basket2 text-success me-2" />
                    Typically Available Produce at {market.name}
                  </h4>
                  <small className="text-muted">Verified crops and artisan goods supplied by regional vendors.</small>
                </div>
                <Link to="/product" className="btn btn-outline-success btn-sm">Full Produce Guide →</Link>
              </div>

              <div className="row g-3">
                {marketProducts.map((p) => (
                  <div className="col-sm-6 col-md-4 col-lg-3" key={p.id}>
                    <div className="produce-mini-card">
                      <img src={asset(p.image)} alt={p.name} className="produce-mini-img" />
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <img src={asset(p.icon)} alt="" className="produce-mini-icon" />
                          <h6 className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.9rem' }}>
                            {p.shortName || p.name}
                          </h6>
                        </div>
                        <span className="badge-category" style={{ fontSize: '0.68rem' }}>
                          {p.category}
                        </span>
                        <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                          {p.season}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   12. PRODUCE GUIDE PAGE (Responsive Horizontal Category Pills)
   ========================================================= */
function ProduceGuide({ data, bookmarks }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProductForNote, setSelectedProductForNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  const categories = [
    { id: 'all', label: '🌾 All Produce' },
    { id: 'fruits', label: '🍎 Fruits' },
    { id: 'vegetables', label: '🥦 Vegetables' },
    { id: 'herbs', label: '🌿 Fresh Herbs' },
    { id: 'dairy', label: '🧀 Farm Dairy' }
  ];

  const filteredProducts = data.products.filter((p) => {
    const matchCat = category === 'all' || p.category.toLowerCase() === category.toLowerCase();
    const matchSearch =
      !search.trim() ||
      (p.name + ' ' + p.description + ' ' + p.season).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenNoteModal = (product) => {
    setSelectedProductForNote(product);
    const existing = bookmarks.notes.find((n) => n.itemId === product.id && n.itemType === 'produce');
    setNoteText(existing ? existing.text : '');
  };

  const handleSaveNoteSubmit = (e) => {
    e.preventDefault();
    if (selectedProductForNote) {
      bookmarks.saveNote(selectedProductForNote.id, 'produce', selectedProductForNote.name, noteText);
      setSelectedProductForNote(null);
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Seasonal Produce Guide' }]} />

        <div className="page-hero p-4 p-md-5 mb-4">
          <div>
            <span className="badge bg-light text-success mb-2 px-3 py-1 fw-bold">PRODUCE GUIDE</span>
            <h1 className="display-5 fw-bold text-white">Seasonal Produce Catalogue</h1>
            <p className="lead mb-0 text-white-50">
              Browse fruits, vegetables, culinary herbs, and dairy with peak seasons and market locations.
            </p>
          </div>
        </div>

        {/* Stable, Non-Jumping Category Filter Card */}
        <div className="category-filter-card mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-lg-8">
              <div className="category-scroll-bar" role="tablist" aria-label="Produce Category Filter">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`category-pill-btn ${category === c.id ? 'active' : ''}`}
                    onClick={() => setCategory(c.id)}
                    role="tab"
                    aria-selected={category === c.id}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-lg-4 category-search-wrapper">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search produce name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search produce guide"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="row g-4">
          {filteredProducts.map((p) => {
            const isSaved = bookmarks.savedProduce.includes(p.id);
            const availableMarkets = data.markets.filter(
              (m) => p.markets && p.markets.includes(m.id)
            );

            return (
              <div className="col-md-6 col-lg-4" key={p.id}>
                <div className="card product-card shadow-sm h-100 border-0">
                  <div className="product-image position-relative">
                    <img src={asset(p.image)} className="card-img-top" alt={p.name} />
                    <span className="badge-season position-absolute top-0 start-0 m-3">
                      <i className="bi bi-sun-fill me-1" />
                      {p.season}
                    </span>
                    <button
                      className={`btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle ${isSaved ? 'btn-danger' : 'btn-light'}`}
                      style={{ width: 36, height: 36, padding: 0 }}
                      onClick={() => bookmarks.toggleProduce(p.id)}
                      aria-label={isSaved ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                      <i className={`bi bi-heart${isSaved ? '-fill' : ''}`} />
                    </button>
                  </div>

                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h5 className="fw-bold mb-0">{p.name}</h5>
                      <img src={asset(p.icon)} alt="" style={{ width: 28, height: 28 }} />
                    </div>

                    <span className="badge-category mb-2 align-self-start">{p.category}</span>

                    <p className="text-muted small mb-2">{p.description}</p>

                    <div className="p-2 border rounded-3 bg-light mb-3" style={{ fontSize: '0.78rem' }}>
                      <strong className="text-success">Nutrition:</strong> {p.nutrition || 'Rich in vitamins'}
                      <br />
                      <strong className="text-dark">Storage Tip:</strong> {p.storageTip || 'Keep chilled.'}
                    </div>

                    <div className="mb-3">
                      <small className="text-muted fw-semibold d-block mb-1">Available at Markets:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {availableMarkets.map((m) => (
                          <Link
                            key={m.id}
                            to={`/market/${m.id}`}
                            className="badge bg-success-subtle text-success text-decoration-none"
                          >
                            📍 {m.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto d-flex gap-2">
                      <button
                        className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-outline-success'} flex-grow-1`}
                        onClick={() => bookmarks.toggleProduce(p.id)}
                      >
                        <i className={`bi bi-heart${isSaved ? '-fill' : ''} me-1`} />
                        {isSaved ? 'Saved in Bookmarks' : 'Save to Bookmarks'}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleOpenNoteModal(p)}
                        title="Add Shopping Note"
                        aria-label="Add shopping note"
                      >
                        <i className="bi bi-pencil-square" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal for Shopping Note */}
        {selectedProductForNote && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="fw-bold modal-title">
                    <i className="bi bi-pencil-square text-success me-2" />
                    Personal Shopping Note
                  </h5>
                  <button className="btn-close" onClick={() => setSelectedProductForNote(null)} />
                </div>
                <form onSubmit={handleSaveNoteSubmit}>
                  <div className="modal-body">
                    <p className="text-muted small">
                      Attach a private shopping note for <strong>{selectedProductForNote.name}</strong>. Saved notes are
                      stored in your session bookmarks.
                    </p>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="e.g. Check stall #4 for sweetest batch, buy 2 kg for Sunday dinner."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      required
                    />
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setSelectedProductForNote(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success px-4">Save Note</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   13. BOOKMARKS PAGE (Saved, Notes, Export, Social Share)
   ========================================================= */
function BookmarksPage({ data, bookmarks }) {
  const [activeTab, setActiveTab] = useState('markets');
  const [copied, setCopied] = useState(false);

  const savedMarketsData = data.markets.filter((m) => bookmarks.savedMarkets.includes(m.id));
  const savedProduceData = data.products.filter((p) => bookmarks.savedProduce.includes(p.id));

  const generateFormattedList = () => {
    let text = `=====================================\n`;
    text += `  FRESHFIND - MY BOOKMARKS & SHOPPING LIST\n`;
    text += `  Generated: ${new Date().toLocaleString()}\n`;
    text += `=====================================\n\n`;

    text += `[SAVED FARMERS MARKETS] (${savedMarketsData.length})\n`;
    if (savedMarketsData.length === 0) {
      text += `  (No markets saved yet)\n`;
    } else {
      savedMarketsData.forEach((m, idx) => {
        text += `${idx + 1}. ${m.name}\n`;
        text += `   Area: ${m.area}, ${m.city}\n`;
        text += `   Schedule: ${m.schedule}\n`;
        text += `   Address: ${m.address}\n\n`;
      });
    }

    text += `[SAVED PRODUCE] (${savedProduceData.length})\n`;
    if (savedProduceData.length === 0) {
      text += `  (No produce saved yet)\n`;
    } else {
      savedProduceData.forEach((p, idx) => {
        text += `${idx + 1}. ${p.name} (${p.category})\n`;
        text += `   Season: ${p.season}\n`;
        text += `   Tip: ${p.storageTip || 'N/A'}\n\n`;
      });
    }

    text += `[PERSONAL SHOPPING NOTES] (${bookmarks.notes.length})\n`;
    if (bookmarks.notes.length === 0) {
      text += `  (No personal notes created)\n`;
    } else {
      bookmarks.notes.forEach((n, idx) => {
        text += `${idx + 1}. [${n.itemTitle}] (${n.updatedAt})\n`;
        text += `   "${n.text}"\n\n`;
      });
    }

    text += `-------------------------------------\n`;
    text += `Find more fresh produce at https://freshfind.local\n`;
    return text;
  };

  const handleExportFile = () => {
    const text = generateFormattedList();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FreshFind-Bookmarks-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const text = generateFormattedList();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = encodeURIComponent(
    `Check out my favorite farmers markets on FreshFind: ${savedMarketsData.map((m) => m.name).join(', ') || 'Local Markets'}`
  );
  const shareUrl = encodeURIComponent(window.location.origin);

  return (
    <main className="bookmark-page container mt-4 mb-5">
      <Breadcrumbs items={[{ label: 'My Bookmarks & Personal Notes' }]} />

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-heart-fill text-danger me-2" />
            My Bookmarks & Personal Notes
          </h2>
          <p className="text-muted mb-0">Saved markets, favorite produce, and session shopping notes</p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-success btn-sm" onClick={handleExportFile} title="Download formatted list">
            <i className="bi bi-download me-1" /> Export List (.txt)
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleCopyClipboard}>
            <i className="bi bi-clipboard me-1" /> {copied ? 'Copied! ✓' : 'Copy List'}
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all bookmarks and notes?')) {
                bookmarks.clearAll();
              }
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Social Sharing Bar */}
      <div className="card p-3 border-0 bg-white shadow-sm rounded-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span className="small fw-semibold text-muted">
            <i className="bi bi-share text-success me-1" /> Share your recommendations via social links:
          </span>
          <div className="share-links-group">
            <a
              href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-btn share-wa"
              aria-label="Share recommendations on WhatsApp"
            >
              <i className="bi bi-whatsapp" /> WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-btn share-tw"
              aria-label="Share on X Twitter"
            >
              <i className="bi bi-twitter-x" /> Twitter / X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-btn share-fb"
              aria-label="Share on Facebook"
            >
              <i className="bi bi-facebook" /> Facebook
            </a>
            <a
              href={`mailto:?subject=My FreshFind Market List&body=${shareText}%0A%0A${shareUrl}`}
              className="social-share-btn share-email"
              aria-label="Share via Email"
            >
              <i className="bi bi-envelope" /> Email
            </a>
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Tabs */}
      <div className="bookmark-tabs-wrapper mb-4" role="tablist">
        <button
          className={`nav-link ${activeTab === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveTab('markets')}
        >
          Saved Markets <span className="badge bg-white text-success ms-1">{savedMarketsData.length}</span>
        </button>
        <button
          className={`nav-link ${activeTab === 'produce' ? 'active' : ''}`}
          onClick={() => setActiveTab('produce')}
        >
          Saved Produce <span className="badge bg-white text-success ms-1">{savedProduceData.length}</span>
        </button>
        <button
          className={`nav-link ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Shopping Notes <span className="badge bg-white text-success ms-1">{bookmarks.notes.length}</span>
        </button>
      </div>

      {/* Tab 1: Saved Markets */}
      {activeTab === 'markets' && (
        <div>
          {savedMarketsData.length === 0 ? (
            <div className="bookmark-empty">
              <i className="bi bi-shop text-muted fs-1 mb-3" />
              <h5 className="fw-bold">No Saved Markets</h5>
              <p className="text-muted">Browse the market directory and click the heart icon to save markets here.</p>
              <Link to="/market" className="btn btn-success px-4">Explore Markets</Link>
            </div>
          ) : (
            <div className="row g-4">
              {savedMarketsData.map((m) => (
                <div className="col-md-6 col-lg-4" key={m.id}>
                  <div className="card shadow-sm h-100 border-0 rounded-4 overflow-hidden">
                    <img src={asset(m.image)} className="card-img-top" alt={m.name} />
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0">{m.name}</h5>
                        <i
                          className="bi bi-heart-fill text-danger fs-5 remove-bookmark"
                          role="button"
                          onClick={() => bookmarks.toggleMarket(m.id)}
                          title="Remove bookmark"
                        />
                      </div>
                      <p className="text-muted small mb-1">
                        <i className="bi bi-geo-alt text-success me-1" /> {m.area}, {m.city}
                      </p>
                      <p className="text-muted small mb-3">
                        <i className="bi bi-clock text-success me-1" /> {m.schedule}
                      </p>
                      <div className="mb-3">
                        {m.produce.map((p) => (
                          <span className="badge tag-badge me-1" key={p}>
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto">
                        <Link to={`/market/${m.id}`} className="btn btn-success btn-sm w-100">
                          View Market Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Produce */}
      {activeTab === 'produce' && (
        <div>
          {savedProduceData.length === 0 ? (
            <div className="bookmark-empty">
              <i className="bi bi-basket2 text-muted fs-1 mb-3" />
              <h5 className="fw-bold">No Saved Produce</h5>
              <p className="text-muted">Browse the Produce Guide and save items you plan to buy.</p>
              <Link to="/product" className="btn btn-success px-4">Open Produce Guide</Link>
            </div>
          ) : (
            <div className="row g-4">
              {savedProduceData.map((p) => (
                <div className="col-md-6 col-lg-4" key={p.id}>
                  <div className="card shadow-sm h-100 border-0 rounded-4 overflow-hidden">
                    <div className="d-flex align-items-center p-3 border-bottom">
                      <img src={asset(p.image)} className="rounded-3 me-3 produce-img" alt={p.name} />
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-0">{p.name}</h6>
                        <small className="text-muted">Season: {p.season}</small>
                      </div>
                      <i
                        className="bi bi-trash text-danger fs-5"
                        role="button"
                        onClick={() => bookmarks.toggleProduce(p.id)}
                        title="Remove produce"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-muted small mb-2">{p.description}</p>
                      <Link to="/product" className="btn btn-outline-success btn-sm w-100">
                        View in Produce Guide
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Personal Notes */}
      {activeTab === 'notes' && (
        <div>
          {bookmarks.notes.length === 0 ? (
            <div className="bookmark-empty">
              <i className="bi bi-journal-text text-muted fs-1 mb-3" />
              <h5 className="fw-bold">No Personal Notes Yet</h5>
              <p className="text-muted">You can attach private shopping notes to any produce item or market.</p>
              <Link to="/product" className="btn btn-success px-4">Explore Produce to Add Notes</Link>
            </div>
          ) : (
            <div className="row g-3">
              {bookmarks.notes.map((n) => (
                <div className="col-md-6" key={n.id}>
                  <div className="note-item shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="fw-bold mb-0 text-success">{n.itemTitle}</h6>
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {n.updatedAt}
                        </small>
                        <i
                          className="bi bi-x-circle text-danger"
                          role="button"
                          onClick={() => bookmarks.deleteNote(n.id)}
                          title="Delete note"
                        />
                      </div>
                    </div>
                    <p className="text-muted small mb-0">"{n.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/* =========================================================
   14. CONTACT US PAGE (Static Info, Live Geolocation Map)
   ========================================================= */
function ContactUs() {
  const [sent, setSent] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [detecting, setDetecting] = useState(false);

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setDetecting(false);
      },
      (err) => {
        alert('Could not access live location: ' + err.message);
        setDetecting(false);
      }
    );
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Contact Us' }]} />

        <div className="page-hero p-4 p-md-5 mb-5">
          <div>
            <span className="badge bg-light text-success mb-2 px-3 py-1 fw-bold">CONTACT US</span>
            <h1 className="display-5 fw-bold text-white">Get in Touch</h1>
            <p className="lead mb-0 text-white-50">
              Have questions, feedback, or want to register a local farmers market? We are here to help.
            </p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card contact-card p-4 h-100 shadow-sm border-0 bg-white">
              <h4 className="fw-bold mb-4">FreshFind Support Team</h4>
              <InfoContact icon="envelope" title="Support Email" text="support@freshfind.com" />
              <InfoContact icon="telephone" title="Community Hotline" text="+92 334 376 590 / +92 21 3568 2211" />
              <InfoContact icon="geo-alt" title="Headquarters" text="Karachi, Sindh, Pakistan" />
              <InfoContact icon="clock" title="Desk Hours" text="Mon – Sat: 8:00 AM – 6:00 PM" />

              <div className="p-3 bg-light rounded-3 mt-4">
                <h6 className="fw-bold text-success mb-1">
                  <i className="bi bi-crosshair me-1" /> Live Geolocation Radar
                </h6>
                <p className="small text-muted mb-2">
                  Check how far you are from our hub and nearest market locations.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success w-100"
                  onClick={handleDetectLiveLocation}
                  disabled={detecting}
                >
                  {detecting ? 'Locating...' : userLoc ? 'Live Location Locked ✓' : 'Detect My Live Location'}
                </button>
                {userLoc && (
                  <div className="alert alert-success mt-2 py-2 small mb-0">
                    📍 Coordinates: <strong>{userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card contact-card p-4 shadow-sm border-0 bg-white">
              <h4 className="fw-bold mb-3">Find Us on the Map</h4>
              <iframe
                className="map-frame mb-4"
                src={
                  userLoc
                    ? `https://maps.google.com/maps?q=${userLoc.lat},${userLoc.lng}&z=13&output=embed`
                    : 'https://maps.google.com/maps?q=Karachi,Pakistan&z=12&output=embed'
                }
                loading="lazy"
                title="FreshFind live location map"
                style={{ height: 260, border: 0, borderRadius: 14 }}
              />

              <h4 className="fw-bold mb-3">Send a Message</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                  e.currentTarget.reset();
                }}
              >
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Your Name</label>
                    <input className="form-control" required placeholder="Ahmed Bilal" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input type="email" className="form-control" required placeholder="ahmed@example.com" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Subject</label>
                    <input className="form-control" required placeholder="Market inquiry or vendor suggestion" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Message</label>
                    <textarea className="form-control" rows="4" required placeholder="How can we assist you?" />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-success w-100 py-2" type="submit">
                      <i className="bi bi-send-fill me-1" /> Send Message
                    </button>
                  </div>
                </div>
              </form>

              {sent && (
                <div className="alert alert-success mt-3 mb-0" role="alert">
                  <i className="bi bi-check-circle-fill me-2" />
                  Thank you! Your message has been received. Our team will contact you shortly.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoContact({ icon, title, text }) {
  return (
    <div className="d-flex gap-3 mb-3">
      <div className="icon-box" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
        <i className={`bi bi-${icon}`} />
      </div>
      <div>
        <h6 className="fw-bold mb-0" style={{ fontSize: '0.92rem' }}>{title}</h6>
        <p className="text-muted mb-0 small">{text}</p>
      </div>
    </div>
  );
}

/* =========================================================
   15. ABOUT US PAGE
   ========================================================= */
function AboutUs() {
  return (
    <main className="page-wrap">
      <div className="container">
        <Breadcrumbs items={[{ label: 'About Us' }]} />

        <div className="page-hero p-4 p-md-5 mb-5">
          <div>
            <span className="badge bg-light text-success mb-2 px-3 py-1 fw-bold">ABOUT FRESHFIND</span>
            <h1 className="display-5 fw-bold text-white">Cultivating Local Connections</h1>
            <p className="lead mb-0 text-white-50">
              Empowering consumers to discover sustainable growers, reducing supply-chain waste, and celebrating fresh food.
            </p>
          </div>
        </div>

        <div className="row g-4 align-items-center mb-5">
          <div className="col-lg-7">
            <div className="card p-4 p-md-5 border-0 shadow-sm rounded-4 bg-white h-100">
              <h3 className="fw-bold mb-3">Our Purpose & Mission</h3>
              <p className="text-muted">
                FreshFind was conceived as an interactive digital directory bridging the gap between urban households and
                regional organic farmers markets across Karachi. Too often, seasonal crop abundance goes unnoticed, and
                shoppers miss out on morning market days.
              </p>
              <p className="text-muted">
                Our lightweight, client-side web application operates without complex server infrastructure, ensuring high
                speed, zero latency, and 100% privacy compliance.
              </p>

              <h5 className="fw-bold mt-3">What FreshFind Delivers</h5>
              <ul className="text-muted small ps-3">
                <li className="mb-2">
                  <strong>Verified Operating Schedules:</strong> Complete weekly tables for Friday, Saturday, Sunday and
                  mid-week morning farmer pop-ups.
                </li>
                <li className="mb-2">
                  <strong>Real-Time Radar:</strong> Instant recognition of markets open right now according to your device's
                  live clock.
                </li>
                <li className="mb-2">
                  <strong>Comprehensive Produce Guide:</strong> Learn about harvest seasons, storage recommendations, and
                  which specific stalls stock them.
                </li>
                <li className="mb-2">
                  <strong>Offline-Friendly Bookmarking:</strong> Personal shopping notes, formatted file export, and instant
                  WhatsApp sharing.
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 rounded-4 overflow-hidden shadow-sm">
              <img src="/images/hero.jpg" className="img-fluid" alt="Fresh market produce display" />
            </div>
          </div>
        </div>

        <div className="my-5">
          <div className="section-kicker">TEAM & COLLABORATORS</div>
          <h2 className="section-title mb-4">The FreshFind Core Team</h2>
          <div className="row g-4">
            <TeamCard
              name="Dr. Nouman Siddiqui"
              role="Lead Architect & Founder"
              bio="Passionate about urban agricultural connectivity, local food security, and lightweight web platforms."
            />
            <TeamCard
              name="Ayesha Raza"
              role="Agricultural Research & Produce Lead"
              bio="Specializes in indigenous Pakistani crops, organic verification, and seasonal harvesting calendars."
            />
            <TeamCard
              name="Hamza Tariq"
              role="Frontend & UX Designer"
              bio="Focused on accessible human-centered interfaces, mobile responsiveness, and high Lighthouse scores."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function TeamCard({ name, role, bio }) {
  return (
    <div className="col-md-4">
      <div className="card p-4 border-0 shadow-sm rounded-4 h-100 bg-white">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="icon-box" style={{ width: 50, height: 50 }}>
            <i className="bi bi-person-badge fs-4" />
          </div>
          <div>
            <h6 className="fw-bold mb-0">{name}</h6>
            <small className="text-success fw-semibold">{role}</small>
          </div>
        </div>
        <p className="text-muted small mb-0">{bio}</p>
      </div>
    </div>
  );
}

/* =========================================================
   16. MAIN APP ROUTER & LAYOUT CONTAINER
   ========================================================= */
function App() {
  const { data } = useData();
  const timeStatus = useRealTimeStatus(data.markets);
  const bookmarks = useBookmarks();
  const visitorData = useVisitorCounter();
  const [loginModal, setLoginModal] = useState({ open: false, tab: 'login' });

  return (
    <div className="d-flex flex-column min-vh-100">
      <LiveRadarBar timeStatus={timeStatus} visitorData={visitorData} />

      <Navbar onLogin={(tab) => setLoginModal({ open: true, tab })} bookmarkCount={bookmarks.totalCount} />

      <div className="flex-grow-1">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                data={data}
                timeStatus={timeStatus}
                bookmarks={bookmarks}
              />
            }
          />
          <Route
            path="/market"
            element={<MarketDirectory data={data} timeStatus={timeStatus} bookmarks={bookmarks} />}
          />
          <Route
            path="/market/:id"
            element={<MarketDetail data={data} timeStatus={timeStatus} bookmarks={bookmarks} />}
          />
          <Route path="/product" element={<ProduceGuide data={data} bookmarks={bookmarks} />} />
          <Route path="/bookmark" element={<BookmarksPage data={data} bookmarks={bookmarks} />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route
            path="*"
            element={
              <Home
                data={data}
                timeStatus={timeStatus}
                bookmarks={bookmarks}
              />
            }
          />
        </Routes>
      </div>

      <Footer visitorCount={visitorData.visitorCount} liveShoppers={visitorData.liveShoppers} />

      <LoginModal
        show={loginModal.open}
        initialTab={loginModal.tab}
        onClose={() => setLoginModal({ open: false, tab: 'login' })}
      />

      <ChatBot data={data} timeStatus={timeStatus} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
