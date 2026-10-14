import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  Activity as ActivityIcon, ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, Check,
  ChevronDown, CircleAlert, Clock3, LayoutDashboard, MapPin, Menu, Package,
  Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, X, ArrowUpDown, Pencil,
  Trash2, Warehouse, LogOut, PackageCheck, RotateCcw,
} from 'lucide-react';
import {
  adjustStock, deleteProduct, getActivity, getProducts, saveProduct,
  subscribeInventory, type Activity, type Product,
} from './data/inventory';

const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const signInPath = `${basePath}/sign-in` || '/sign-in';
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/shelfwise-mark.svg`,
  },
  variables: {
    colorPrimary: '#2d6555',
    colorForeground: '#25333a',
    colorMutedForeground: '#718078',
    colorDanger: '#b64d43',
    colorBackground: '#fffefa',
    colorInput: '#fffefa',
    colorInputForeground: '#25333a',
    colorNeutral: '#e7e2d7',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '10px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffefa] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-bold tracking-tight text-[#25333a]',
    headerSubtitle: 'text-[#718078]',
    socialButtonsBlockButtonText: 'hidden',
    formFieldLabel: 'text-[#25333a]',
    footerActionLink: 'font-semibold text-[#2d6555]',
    footerActionText: 'text-[#718078]',
    footerAction: 'hidden',
    dividerText: 'hidden',
    identityPreviewEditButton: 'text-[#2d6555]',
    formFieldSuccessText: 'text-[#2d6555]',
    alertText: 'text-[#25333a]',
    logoBox: 'justify-center',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'hidden',
    formButtonPrimary: 'font-semibold',
    formFieldInput: 'border-[#e7e2d7] bg-white text-[#25333a]',
    dividerLine: 'hidden',
    dividerRow: 'hidden',
    alert: 'border-[#e7e2d7]',
    otpCodeFieldInput: 'border-[#e7e2d7] bg-white text-[#25333a]',
    formFieldRow: 'text-[#25333a]',
    main: 'text-[#25333a]',
  },
};
const clerkLocalization = {
  signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your Shelfwise workspace' } },
};

function Brand({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return <span className={`brand ${light ? 'brand-light' : ''}`}>
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none"><path d="M5 11.2 18 4l13 7.2v13.6L18 32 5 24.8V11.2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/><path d="m5.7 11.5 12.3 7 12.3-7M18 18.8V31M11.2 7.8l13 7.3" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round"/><path d="M9.8 19.5v3.8l5.1 2.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg>
    </span>
    {!compact && <span className="brand-word">shelfwise<span className="brand-dot">.</span></span>}
  </span>;
}

function useInventory() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [activity, setActivity] = useState<Activity[]>(() => getActivity());
  useEffect(() => subscribeInventory(() => {
    setProducts(getProducts());
    setActivity(getActivity());
  }), []);
  return { products, activity };
}
function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}
function Header({ title, eyebrow, children }: { title: string; eyebrow: string; children?: ReactNode }) {
  return <div className="page-head">
    <div><div className="eyebrow">{eyebrow}</div><h1 className="display page-title">{title}</h1></div>
    <div className="head-actions">{children}</div>
  </div>;
}
function SideNav({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const { products } = useInventory();
  const nav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/stock', label: 'Stock movement', icon: ArrowUpDown },
  ];
  return <aside className="sidebar">
    <Link href="/" className="side-brand" onClick={onNavigate}><Brand /></Link>
    <div className="side-caption">WORKSPACE</div>
    <nav className="nav-links" aria-label="Main navigation">
      {nav.map(item => {
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} onClick={onNavigate} className={`nav-link ${path === item.href ? 'nav-active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
          <Icon size={18} strokeWidth={1.8}/><span>{item.label}</span>{item.href === '/inventory' && <span className="nav-count">{products.length}</span>}
        </Link>;
      })}
    </nav>
    <div className="sidebar-foot">
      <div className="warehouse-card"><span className="warehouse-icon"><Warehouse size={16}/></span><span><b>North Dock</b><small>Warehouse · Demo</small></span><ChevronDown size={14}/></div>
      <div className="privacy-note"><ShieldCheck size={14}/><span>Your demo data stays<br/>on this device.</span></div>
    </div>
  </aside>;
}
function Topbar() {
  const { user } = useUser();
  const clerk = useClerk();
  const name = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Team member';
  const initial = name.slice(0, 1).toUpperCase();
  return <header className="topbar">
    <div className="topbar-mobile"><Brand compact/><span className="mobile-warehouse">North Dock</span></div>
    <div className="topbar-location"><span className="live-dot"/><span>North Dock warehouse</span><span className="topbar-divider">/</span><span>Demo workspace</span></div>
    <div className="topbar-user"><span className="user-avatar">{initial}</span><span className="user-name">{name}</span><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={() => clerk.signOut({ redirectUrl: '/' })} data-testid="button-sign-out"><LogOut size={16}/></button></div>
  </header>;
}
function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell grain">
    <SideNav path={location} onNavigate={() => setMenuOpen(false)}/>
    <div className="mobile-sidebar-trigger"><button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={19}/></button>{menuOpen && <div className="mobile-menu"><SideNav path={location} onNavigate={() => setMenuOpen(false)}/></div>}</div>
    <main className="main-area"><Topbar/><div className="page-content enter">{children}</div></main>
  </div>;
}
function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (isLoaded && isSignedIn) setLocation('/dashboard'); }, [isLoaded, isSignedIn, setLocation]);
  return <div className="landing grain">
    <header className="landing-nav"><Link href="/" className="landing-brand"><Brand/></Link><div className="landing-nav-right"><span className="nav-quiet">Made for the people who keep things moving.</span><Link href={signInPath} className="btn btn-outline">Sign in <ArrowRight size={15}/></Link></div></header>
    <main>
      <section className="hero">
        <div className="hero-copy enter">
          <div className="eyebrow"><span className="live-dot"/> THE SMALL-TEAM STOCKROOM</div>
          <h1 className="display">Know what’s<br/>on your <em>shelves.</em></h1>
          <p>A calmer way to keep tabs on stock, spot what’s running low, and make everyday warehouse updates.</p>
          <div className="hero-actions"><Link href={signInPath} className="btn btn-primary">Worker sign in <ArrowRight size={16}/></Link><span className="text-link">For authorized warehouse staff</span></div>
          <div className="hero-proof"><div className="proof-avatars"><span>J</span><span>M</span><span>A</span></div><span>Built for real shifts, not spreadsheets.</span></div>
        </div>
        <div className="hero-visual enter">
          <div className="visual-topline"><span>YOUR STOCKROOM, AT A GLANCE</span><span className="mono">TUE, 10:42 AM</span></div>
          <div className="mock-dashboard">
            <div className="mock-sidebar"><Brand compact/><div className="mock-nav on"><LayoutDashboard size={15}/></div><div className="mock-nav"><Package size={15}/></div><div className="mock-nav"><ArrowUpDown size={15}/></div><div className="mock-side-bottom"/></div>
            <div className="mock-main">
              <div className="mock-greet"><div><small>GOOD MORNING, JUNE</small><b>Here’s your stockroom.</b></div><div className="mock-circle">J</div></div>
              <div className="mock-stats"><div className="mock-stat"><span>PRODUCTS</span><b>128</b><small>across 4 categories</small></div><div className="mock-stat"><span>UNITS ON HAND</span><b>2,486</b><small>ready to pick</small></div></div>
              <div className="mock-low"><div className="mock-section-title"><span>Needs a look</span><span className="mock-pill">3 items</span></div><div className="mock-item"><i className="mock-swatch orange"/> <span>Thermal label roll</span><code>28 left</code><b>Low</b></div><div className="mock-item"><i className="mock-swatch coral"/> <span>Pallet stretch film</span><code>12 left</code><b>Low</b></div></div>
              <div className="mock-recent"><span>JUST UPDATED</span><div><PackageCheck size={14}/><p><b>Kraft mailer, medium</b><small>Received 48 units · 10:18 am</small></p><span className="mock-plus">+48</span></div></div>
            </div>
          </div>
          <div className="visual-foot"><span><span className="live-dot"/> Your team’s day, in view</span><span>01 / 03</span></div>
        </div>
        <div className="hero-side-note">LESS GUESSING<br/>MORE GETTING IT DONE <span>↘</span></div>
      </section>
      <section className="promise-strip"><div><span className="promise-number">01</span><b>Find it fast</b><span>Search by product, SKU, or location.</span></div><div><span className="promise-number">02</span><b>Stay ahead</b><span>Low-stock signals, without the noise.</span></div><div><span className="promise-number">03</span><b>Keep a clear trail</b><span>Every stock change has a history.</span></div></section>
      <section className="landing-detail"><div className="detail-label">A BETTER STOCKROOM ROUTINE <span>EST. FOR SMALL TEAMS</span></div><div className="detail-body"><h2 className="display">Small updates.<br/><em>Big picture.</em></h2><div><p>No complicated setup. No training day. Just a dependable home for your inventory, built around the work your team already does.</p><Link href={signInPath} className="detail-link">Worker sign in <ArrowRight size={16}/></Link></div></div></section>
    </main>
    <footer className="landing-footer"><Brand/><span>Inventory, in good order.</span><span>Demo data stays in your browser</span></footer>
  </div>;
}
function StatCard({ label, value, foot, icon, tone = 'green' }: { label: string; value: string | number; foot: string; icon: ReactNode; tone?: string }) {
  return <div className="stat-card panel"><div className="stat-card-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className="stat-value display" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div><div className="stat-foot">{foot}</div></div>;
}
function ActivityList({ items, limit = 6 }: { items: Activity[]; limit?: number }) {
  if (!items.length) return <div className="empty-activity"><div className="empty-icon"><ActivityIcon size={18}/></div><b>No updates yet</b><span>Stock changes will show up here.</span></div>;
  return <div className="activity-list">{items.slice(0, limit).map((event, index) => {
    const inbound = event.action === 'received';
    const label = event.action === 'received' ? 'Stock received' : event.action === 'removed' ? 'Stock removed' : event.action === 'created' ? 'Product added' : event.action === 'deleted' ? 'Product removed' : 'Product updated';
    const Icon = inbound ? ArrowDownLeft : event.action === 'removed' ? ArrowUpRight : event.action === 'deleted' ? Trash2 : Check;
    return <div className="activity-row" key={event.id} data-testid={`activity-row-${event.id}`}><span className={`activity-icon ${inbound ? 'positive' : event.action === 'removed' ? 'negative' : ''}`}><Icon size={15}/></span><div className="activity-copy"><b>{event.productName}</b><span>{label}{event.quantity ? ` · ${event.quantity} units` : ''}{event.note ? ` · ${event.note}` : ''}</span></div><time>{index === 0 ? 'Just now' : fmtDate(event.createdAt)}</time></div>;
  })}</div>;
}
function Dashboard() {
  const { products, activity } = useInventory();
  const low = products.filter(p => p.quantity <= p.reorderLevel);
  const total = products.reduce((sum, p) => sum + p.quantity, 0);
  const [, setLocation] = useLocation();
  return <div>
    <Header title="Good morning." eyebrow={`${new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date()).toUpperCase()}, YOUR STOCKROOM AT A GLANCE`}>
      <button className="btn btn-outline" onClick={() => setLocation('/stock')} data-testid="button-dashboard-update"><Plus size={16}/> Update stock</button>
    </Header>
    <div className="stats-grid">
      <StatCard label="Products" value={products.length} foot="unique items in your catalog" icon={<Package size={17}/>} />
      <StatCard label="Available units" value={total.toLocaleString()} foot="units across all products" icon={<Boxes size={17}/>} tone="sand"/>
      <StatCard label="Low stock" value={low.length} foot={low.length ? 'items at or below reorder level' : 'nothing needs attention'} icon={<CircleAlert size={17}/>} tone={low.length ? 'orange' : 'green'}/>
    </div>
    <div className="dashboard-grid">
      <section className="panel low-panel">
        <div className="section-heading"><div><div className="eyebrow">KEEP AN EYE ON</div><h2 className="display">Running low</h2></div><Link href="/inventory" className="subtle-link">All inventory <ArrowRight size={15}/></Link></div>
        {!low.length ? <div className="well-stocked"><span className="well-icon"><Check size={18}/></span><b>Everything’s looking good.</b><span>No items are below their reorder level.</span></div> : <div className="low-list">{low.slice(0, 5).map(p => <div key={p.id} className="low-item" data-testid={`low-stock-${p.id}`}><span className="low-dot"/><div className="low-name"><b>{p.name}</b><small>{p.sku} <span>·</span> {p.location}</small></div><div className="low-qty"><b>{p.quantity}</b><small>of {p.reorderLevel} min.</small></div><Link href="/stock" className="low-action" title={`Update ${p.name}`}><Plus size={16}/></Link></div>)}</div>}
        <div className="low-bottom"><span><CircleAlert size={14}/> Reorder level is set per product.</span><Link href="/inventory">Manage products</Link></div>
      </section>
      <section className="panel recent-panel">
        <div className="section-heading"><div><div className="eyebrow">THE PAPER TRAIL</div><h2 className="display">Recent activity</h2></div><span className="fresh-badge"><span className="live-dot"/> LIVE</span></div>
        <ActivityList items={activity} limit={6}/>
        <Link href="/stock" className="activity-footer">Record a stock change <ArrowRight size={15}/></Link>
      </section>
    </div>
    <div className="dashboard-note"><Sparkles size={15}/><span><b>Good stock habits, made simple.</b> Every adjustment updates your on-hand count and keeps a note for the next shift.</span><Link href="/stock">Make an update <ArrowRight size={14}/></Link></div>
  </div>;
}

function ProductForm({ product, onSave, onCancel }: { product?: Product; onSave: (value: Omit<Product, 'id' | 'updatedAt'>) => void; onCancel: () => void }) {
  const [error, setError] = useState('');
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const sku = String(form.get('sku') || '').trim();
    const quantity = Number(form.get('quantity'));
    const reorderLevel = Number(form.get('reorderLevel'));
    if (!name || !sku || !String(form.get('category') || '').trim() || !String(form.get('location') || '').trim()) { setError('Please complete each field.'); return; }
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(reorderLevel) || reorderLevel < 0) { setError('Quantity and reorder level must be zero or more.'); return; }
    onSave({ name, sku, category: String(form.get('category')).trim(), location: String(form.get('location')).trim().toUpperCase(), quantity, reorderLevel });
  }
  return <form onSubmit={submit} className="product-form">
    <div className="form-grid"><label>Product name<input className="field" name="name" placeholder="e.g. Kraft mailer, medium" defaultValue={product?.name} required autoFocus data-testid="input-product-name"/></label><label>SKU<input className="field mono" name="sku" placeholder="e.g. PKG-2041" defaultValue={product?.sku} required data-testid="input-product-sku"/></label><label>Category<input className="field" name="category" placeholder="e.g. Packaging" defaultValue={product?.category} required data-testid="input-product-category"/></label><label>Location<input className="field mono" name="location" placeholder="e.g. A-01-03" defaultValue={product?.location} required data-testid="input-product-location"/></label><label>On-hand quantity<input className="field" name="quantity" type="number" min="0" step="1" defaultValue={product?.quantity ?? 0} required data-testid="input-product-quantity"/></label><label>Reorder level<input className="field" name="reorderLevel" type="number" min="0" step="1" defaultValue={product?.reorderLevel ?? 10} required data-testid="input-product-reorder-level"/></label></div>
    {error && <div className="form-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="btn btn-quiet" onClick={onCancel} data-testid="button-cancel-product">Cancel</button><button type="submit" className="btn btn-primary" data-testid="button-save-product">{product ? 'Save changes' : 'Add product'}</button></div>
  </form>;
}
function Modal({ title, subtitle, onClose, children, danger = false }: { title: string; subtitle: string; onClose: () => void; children: ReactNode; danger?: boolean }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className={`modal-icon ${danger ? 'danger' : ''}`}>{danger ? <Trash2 size={18}/> : <Package size={18}/>}</div></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div><h2 className="display modal-title" id="modal-title">{title}</h2><p className="modal-subtitle">{subtitle}</p>{children}</section></div>;
}
function Inventory() {
  const { products } = useInventory();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [modal, setModal] = useState<'new' | Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const categories = useMemo(() => ['All categories', ...Array.from(new Set(products.map(p => p.category))).sort()], [products]);
  const filtered = products.filter(p => {
    const match = `${p.name} ${p.sku} ${p.category} ${p.location}`.toLowerCase().includes(query.toLowerCase().trim());
    return match && (category === 'All categories' || p.category === category);
  });
  const save = (value: Omit<Product, 'id' | 'updatedAt'>) => {
    saveProduct(value, typeof modal === 'object' && modal ? modal.id : undefined);
    setModal(null);
  };
  return <div>
    <Header title="Inventory" eyebrow="YOUR PRODUCTS, IN ONE PLACE">
      <button className="btn btn-primary" onClick={() => setModal('new')} data-testid="button-add-product"><Plus size={16}/> Add product</button>
    </Header>
    <div className="inventory-summary"><div className="summary-mark"><Boxes size={18}/></div><div><b>{products.length} products</b><span>Across {categories.length > 1 ? categories.length - 1 : 0} categories · {products.reduce((n,p)=>n+p.quantity,0).toLocaleString()} total units</span></div><div className="summary-note"><span className="live-dot"/> Changes save automatically on this device</div></div>
    <section className="panel inventory-panel">
      <div className="inventory-toolbar"><div className="search-field"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, SKU, or location…" aria-label="Search inventory" data-testid="input-search-inventory"/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={15}/></button>}</div><label className="filter-select"><SlidersHorizontal size={15}/><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category" data-testid="select-category">{categories.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={14}/></label></div>
      <div className="table-scroll"><table className="inventory-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>LOCATION</th><th>ON HAND</th><th>REORDER AT</th><th>UPDATED</th><th></th></tr></thead><tbody>
      {filtered.map(p => <tr className="table-row" key={p.id} data-testid={`row-product-${p.id}`}><td><div className="product-cell"><span className="product-thumb"><Package size={17}/></span><span><b>{p.name}</b><small>{p.quantity <= p.reorderLevel ? <em className="stock-alert">Low stock</em> : 'In stock'}</small></span></div></td><td><span className="sku">{p.sku}</span></td><td><span className="category-tag">{p.category}</span></td><td><span className="location-cell"><MapPin size={13}/>{p.location}</span></td><td><b className={p.quantity <= p.reorderLevel ? 'qty-low' : ''}>{p.quantity}</b></td><td>{p.reorderLevel} units</td><td className="updated-cell">{fmtDate(p.updatedAt)}</td><td><div className="row-actions"><button className="icon-button" title={`Edit ${p.name}`} aria-label={`Edit ${p.name}`} onClick={() => setModal(p)} data-testid={`button-edit-${p.id}`}><Pencil size={15}/></button><button className="icon-button delete-icon" title={`Delete ${p.name}`} aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)} data-testid={`button-delete-${p.id}`}><Trash2 size={15}/></button></div></td></tr>)}
      </tbody></table></div>
      {!filtered.length && <div className="empty-inventory"><div className="empty-icon"><Search size={18}/></div><b>{products.length ? 'No products match that search.' : 'Your shelves are waiting.'}</b><span>{products.length ? 'Try another name, SKU, or category.' : 'Add a product to start tracking stock.'}</span>{!products.length && <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15}/> Add your first product</button>}</div>}
      <div className="table-foot"><span>Showing <b>{filtered.length}</b> of <b>{products.length}</b> products</span><span>Local demo inventory <span className="local-lock"><ShieldCheck size={13}/> Private to this browser</span></span></div>
    </section>
    {modal && <Modal title={modal === 'new' ? 'Add a product' : 'Edit product'} subtitle={modal === 'new' ? 'Add the details your team needs to find and count this item.' : 'Keep the product details and shelf location up to date.'} onClose={() => setModal(null)}><ProductForm product={typeof modal === 'object' ? modal : undefined} onSave={save} onCancel={() => setModal(null)}/></Modal>}
    {deleting && <Modal title="Remove this product?" subtitle={`${deleting.name} will be removed from your inventory. The change will be recorded in activity.`} onClose={() => setDeleting(null)} danger><div className="delete-confirm"><span className="delete-product"><Package size={16}/>{deleting.name}<small>{deleting.sku}</small></span><div className="modal-actions"><button className="btn btn-quiet" onClick={() => setDeleting(null)}>Keep product</button><button className="btn btn-danger" onClick={() => { deleteProduct(deleting.id); setDeleting(null); }} data-testid="button-confirm-delete">Remove product</button></div></div></Modal>}
  </div>;
}
function Stock() {
  const { products, activity } = useInventory();
  const [productId, setProductId] = useState('');
  const [direction, setDirection] = useState<'received' | 'removed'>('received');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selected = products.find(p => p.id === productId) || products[0];
  useEffect(() => { if (!productId && products.length) setProductId(products[0].id); }, [productId, products]);
  function submit(e: FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    const count = Number(amount);
    if (!selected) { setError('Add a product before recording a stock change.'); return; }
    if (!Number.isInteger(count) || count <= 0) { setError('Enter a whole number greater than zero.'); return; }
    try {
      adjustStock(selected.id, direction, count, note);
      setSuccess(`${count} ${count === 1 ? 'unit' : 'units'} ${direction === 'received' ? 'received into' : 'removed from'} ${selected.name}.`);
      setAmount(''); setNote('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update stock.'); }
  }
  return <div>
    <Header title="Stock movement" eyebrow="RECEIVE OR REMOVE UNITS"/>
    <div className="stock-layout">
      <section className="panel stock-form-panel">
        <div className="stock-intro"><div className="stock-illustration"><ArrowUpDown size={21}/></div><div><h2 className="display">Make a stock update</h2><p>Record what came in or went out. Your on-hand count updates right away.</p></div></div>
        <form onSubmit={submit} className="stock-form">
          <label>Product<select className="field" value={selected?.id || ''} onChange={e => setProductId(e.target.value)} data-testid="select-stock-product"><option value="" disabled>Select a product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</select></label>
          {selected && <div className="selected-stock"><span className="selected-thumb"><Package size={17}/></span><span><small>AVAILABLE NOW</small><b>{selected.quantity} units</b></span><span className="selected-location"><MapPin size={13}/>{selected.location}</span></div>}
          <fieldset className="direction-field"><legend>What happened?</legend><div className="direction-options"><button type="button" className={`direction-choice ${direction === 'received' ? 'selected receive' : ''}`} onClick={() => setDirection('received')} data-testid="button-stock-received"><span><ArrowDownLeft size={17}/></span><b>Received</b><small>Add units to stock</small></button><button type="button" className={`direction-choice ${direction === 'removed' ? 'selected remove' : ''}`} onClick={() => setDirection('removed')} data-testid="button-stock-removed"><span><ArrowUpRight size={17}/></span><b>Removed</b><small>Take units out</small></button></div></fieldset>
          <label>Quantity<input className="field stock-number" type="number" min="1" step="1" placeholder="How many units?" value={amount} onChange={e => setAmount(e.target.value)} data-testid="input-stock-quantity"/></label>
          <label>Note <span className="optional">OPTIONAL</span><input className="field" value={note} onChange={e => setNote(e.target.value)} placeholder={direction === 'received' ? 'e.g. Delivery from supplier' : 'e.g. Order #4812 packed'} data-testid="input-stock-note"/></label>
          {error && <div className="form-error"><CircleAlert size={15}/>{error}</div>}
          {success && <div className="form-success"><Check size={15}/>{success}</div>}
          <button className="btn btn-primary stock-submit" type="submit" disabled={!products.length} data-testid="button-submit-stock">{direction === 'received' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}{direction === 'received' ? 'Record received stock' : 'Record stock removal'}</button>
          <p className="stock-footnote"><ShieldCheck size={14}/> Your update is saved to this browser and added to activity.</p>
        </form>
      </section>
      <section className="panel stock-history">
        <div className="section-heading"><div><div className="eyebrow">RECENT CHANGES</div><h2 className="display">Activity trail</h2></div><span className="fresh-badge"><Clock3 size={13}/> LAST 80</span></div>
        <ActivityList items={activity} limit={10}/>
        <Link href="/inventory" className="activity-footer">Browse all products <ArrowRight size={15}/></Link>
      </section>
    </div>
    <div className="stock-hint"><RotateCcw size={16}/><div><b>Need to correct a count?</b><span>Choose “Received” or “Removed” to bring the quantity back in line. Each change is kept in the activity trail.</span></div></div>
  </div>;
}
function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (isLoaded && !isSignedIn) setLocation(signInPath); }, [isLoaded, isSignedIn, setLocation]);
  if (!isLoaded) return <div className="auth-loading"><div className="loading-brand"><Brand/></div><div className="loading-skeleton"><i/><i/><i/></div></div>;
  if (!isSignedIn) return null;
  return <AppShell>{children}</AppShell>;
}
function AuthRoute() {
  return <div className="auth-page grain"><Link href="/" className="auth-brand"><Brand/></Link><div className="auth-aside"><div className="auth-aside-kicker">SHELFWISE / NORTH DOCK</div><div className="auth-aside-copy display">A clear view<br/>of <em>what’s next.</em></div><div className="auth-aside-bottom"><span className="auth-graphic"><Boxes size={24}/></span><p>Your stockroom, organized.<br/>Your next shift, already in the know.</p></div></div><div className="auth-content"><div className="auth-card-wrap"><SignIn routing="path" path={signInPath}/></div><span className="auth-legal">PRIVATE BY DESIGN <span>·</span> WAREHOUSE STAFF ONLY</span></div></div>;
}
function NotFound() {
  return <div className="not-found"><Brand/><span className="eyebrow">404 · WRONG AISLE</span><h1 className="display">We couldn’t find<br/>that shelf.</h1><p>The page may have moved or the address may be off.</p><Link href="/dashboard" className="btn btn-primary">Back to overview <ArrowRight size={16}/></Link></div>;
}
function ClerkApp() {
  return <Switch>
    <Route path="/"><PublicHome/></Route>
    <Route path="/dashboard"><Protected><Dashboard/></Protected></Route>
    <Route path="/inventory"><Protected><Inventory/></Protected></Route>
    <Route path="/stock"><Protected><Stock/></Protected></Route>
    <Route path="/sign-in/*?"><AuthRoute/></Route>
    <Route><NotFound/></Route>
  </Switch>;
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    localization={clerkLocalization}
    signInUrl={signInPath}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <ClerkApp/>
  </ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes/></WouterRouter>;
}
export default App;
