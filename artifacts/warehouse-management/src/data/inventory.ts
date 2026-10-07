export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: string;
  quantity: number;
  reorderLevel: number;
  updatedAt: string;
};

export type Activity = {
  id: string;
  productId: string;
  productName: string;
  action: 'received' | 'removed' | 'created' | 'updated' | 'deleted';
  quantity: number;
  note: string;
  createdAt: string;
};

const PRODUCT_KEY = 'shelfwise.products.v1';
const ACTIVITY_KEY = 'shelfwise.activity.v1';
const CHANGE_EVENT = 'shelfwise:data-change';

const now = () => new Date().toISOString();
const daysAgo = (days: number, hours = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 20, 0, 0);
  return d.toISOString();
};
const seedProducts: Product[] = [
  { id: 'p-01', name: 'Kraft mailer, medium', sku: 'PKG-2041', category: 'Packaging', location: 'A-01-03', quantity: 184, reorderLevel: 60, updatedAt: daysAgo(0, 10) },
  { id: 'p-02', name: 'Thermal label roll', sku: 'LBL-1008', category: 'Shipping', location: 'B-02-01', quantity: 28, reorderLevel: 35, updatedAt: daysAgo(0, 9) },
  { id: 'p-03', name: 'Cotton work gloves', sku: 'SAF-4402', category: 'Safety', location: 'C-01-02', quantity: 76, reorderLevel: 24, updatedAt: daysAgo(1) },
  { id: 'p-04', name: 'Bubble wrap, 12 in', sku: 'PKG-1200', category: 'Packaging', location: 'A-03-01', quantity: 43, reorderLevel: 30, updatedAt: daysAgo(2) },
  { id: 'p-05', name: 'Pallet stretch film', sku: 'PKG-3026', category: 'Packaging', location: 'A-02-04', quantity: 12, reorderLevel: 18, updatedAt: daysAgo(2, 14) },
  { id: 'p-06', name: 'Box cutter blades', sku: 'TLS-0082', category: 'Tools', location: 'C-02-03', quantity: 91, reorderLevel: 20, updatedAt: daysAgo(3) },
  { id: 'p-07', name: 'Corrugated box, 10×8', sku: 'PKG-1088', category: 'Packaging', location: 'A-01-01', quantity: 312, reorderLevel: 80, updatedAt: daysAgo(4) },
  { id: 'p-08', name: 'Pallet corner guards', sku: 'SHI-0057', category: 'Shipping', location: 'B-03-02', quantity: 7, reorderLevel: 12, updatedAt: daysAgo(5) },
];
const seedActivity: Activity[] = [
  { id: 'a-01', productId: 'p-02', productName: 'Thermal label roll', action: 'removed', quantity: 12, note: 'Order #4812 packed', createdAt: daysAgo(0, 9) },
  { id: 'a-02', productId: 'p-01', productName: 'Kraft mailer, medium', action: 'received', quantity: 48, note: 'Delivery from Northline Supply', createdAt: daysAgo(0, 10) },
  { id: 'a-03', productId: 'p-05', productName: 'Pallet stretch film', action: 'removed', quantity: 6, note: 'Shift pick', createdAt: daysAgo(1, 15) },
  { id: 'a-04', productId: 'p-03', productName: 'Cotton work gloves', action: 'received', quantity: 24, note: 'Cycle count correction', createdAt: daysAgo(1, 11) },
  { id: 'a-05', productId: 'p-04', productName: 'Bubble wrap, 12 in', action: 'removed', quantity: 8, note: 'Order #4798 packed', createdAt: daysAgo(2, 13) },
];

function read<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : initial;
  } catch {
    return initial;
  }
}
function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
export function getProducts() {
  const stored = read<Product[] | null>(PRODUCT_KEY, null);
  if (!stored) {
    write(PRODUCT_KEY, seedProducts);
    return seedProducts;
  }
  return stored;
}
export function getActivity() {
  const stored = read<Activity[] | null>(ACTIVITY_KEY, null);
  if (!stored) {
    write(ACTIVITY_KEY, seedActivity);
    return seedActivity;
  }
  return stored;
}
export function subscribeInventory(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
export function addActivity(activity: Omit<Activity, 'id' | 'createdAt'>) {
  const history = getActivity();
  write(ACTIVITY_KEY, [{ ...activity, id: crypto.randomUUID(), createdAt: now() }, ...history].slice(0, 80));
}
export function saveProduct(product: Omit<Product, 'id' | 'updatedAt'>, id?: string) {
  const products = getProducts();
  if (id) {
    const previous = products.find(p => p.id === id);
    write(PRODUCT_KEY, products.map(p => p.id === id ? { ...p, ...product, updatedAt: now() } : p));
    addActivity({ productId: id, productName: product.name, action: 'updated', quantity: 0, note: `Details updated${previous?.name !== product.name ? ` · formerly ${previous?.name}` : ''}` });
    return id;
  }
  const newId = crypto.randomUUID();
  write(PRODUCT_KEY, [{ ...product, id: newId, updatedAt: now() }, ...products]);
  addActivity({ productId: newId, productName: product.name, action: 'created', quantity: 0, note: 'Product added to inventory' });
  return newId;
}
export function deleteProduct(id: string) {
  const products = getProducts();
  const product = products.find(p => p.id === id);
  write(PRODUCT_KEY, products.filter(p => p.id !== id));
  if (product) addActivity({ productId: id, productName: product.name, action: 'deleted', quantity: 0, note: 'Product removed from inventory' });
}
export function adjustStock(id: string, direction: 'received' | 'removed', amount: number, note: string) {
  const products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) return;
  if (direction === 'removed' && amount > product.quantity) throw new Error(`Only ${product.quantity} units are currently available.`);
  write(PRODUCT_KEY, products.map(p => p.id === id ? { ...p, quantity: p.quantity + (direction === 'received' ? amount : -amount), updatedAt: now() } : p));
  addActivity({ productId: id, productName: product.name, action: direction, quantity: amount, note: note.trim() || (direction === 'received' ? 'Stock received' : 'Stock removed') });
}
