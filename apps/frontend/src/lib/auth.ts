import { writable, derived } from 'svelte/store';
import { goto } from '$app/navigation';

// ─── Role definitions ────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'operator' | 'user';

export interface RoleConfig {
  label: string;
  color: string;
  glowColor: string;
  badge: string;
  description: string;
  capabilities: string[];
  allowedRoutes: string[];
  dashboardRoute: string;
}

export const ROLES: Record<UserRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.35)',
    badge: 'SA',
    description: 'Akses penuh ke seluruh sistem termasuk konfigurasi server, manajemen user, dan semua data.',
    capabilities: [
      'Kelola semua user & role',
      'Konfigurasi sistem global',
      'Akses semua plant & device',
      'Export & delete semua data',
      'Audit log & keamanan sistem',
      'Manajemen infrastruktur',
    ],
    allowedRoutes: ['*'],
    dashboardRoute: '/dashboard',
  },
  admin: {
    label: 'Admin',
    color: '#6366f1',
    glowColor: 'rgba(99,102,241,0.35)',
    badge: 'AD',
    description: 'Mengelola operasional harian, user dalam organisasi, dan konfigurasi plant & device.',
    capabilities: [
      'Kelola user (bukan super admin)',
      'Tambah/edit plant & device',
      'Lihat semua data & laporan',
      'Konfigurasi alert & notifikasi',
      'Export laporan',
    ],
    allowedRoutes: ['/dashboard', '/devices', '/plant', '/alerts', '/report', '/settings', '/maintenance'],
    dashboardRoute: '/dashboard',
  },
  operator: {
    label: 'Operator',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.35)',
    badge: 'OP',
    description: 'Memantau performa sistem, merespons alert, dan mencatat data maintenance.',
    capabilities: [
      'Monitor realtime semua device',
      'Kelola & tutup alert aktif',
      'Input data maintenance',
      'Lihat laporan operasional',
    ],
    allowedRoutes: ['/dashboard', '/devices', '/alerts', '/maintenance', '/report'],
    dashboardRoute: '/dashboard',
  },
  user: {
    label: 'User',
    color: '#38bdf8',
    glowColor: 'rgba(56,189,248,0.35)',
    badge: 'US',
    description: 'Akses baca ke dashboard dan laporan untuk plant yang ditugaskan.',
    capabilities: [
      'Lihat dashboard monitoring',
      'Lihat data device (read-only)',
      'Lihat laporan & grafik',
    ],
    allowedRoutes: ['/dashboard', '/report'],
    dashboardRoute: '/dashboard',
  },
};

// ─── Demo credentials (replace with real API) ───────────────────────────────

export const DEMO_USERS: Array<{ email: string; password: string; name: string; role: UserRole }> = [
  { email: 'superadmin@ress.id', password: 'super123', name: 'Superadmin RESS', role: 'super_admin' },
  { email: 'admin@ress.id',      password: 'admin123', name: 'Admin Operator',  role: 'admin' },
  { email: 'operator@ress.id',   password: 'ops123',   name: 'Budi Santoso',    role: 'operator' },
  { email: 'user@ress.id',       password: 'user123',  name: 'Andi Wijaya',     role: 'user' },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

function createAuthStore() {
  const { subscribe, set } = writable<AuthUser | null>(null);

  function load() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('ress-auth-user');
    if (raw) {
      try { set(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }

  function login(user: AuthUser) {
    localStorage.setItem('ress-auth-user', JSON.stringify(user));
    localStorage.setItem('ress-authenticated', 'true');
    set(user);
  }

  function logout() {
    localStorage.removeItem('ress-auth-user');
    localStorage.removeItem('ress-authenticated');
    set(null);
    goto('/login');
  }

  return { subscribe, load, login, logout };
}

export const authStore = createAuthStore();

// Derived helpers
export const isAuthenticated = derived(authStore, ($u) => $u !== null);
export const currentRole = derived(authStore, ($u) => ($u ? ROLES[$u.role] : null));

// ─── Permission check ────────────────────────────────────────────────────────

export function canAccess(user: AuthUser | null, path: string): boolean {
  if (!user) return false;
  const config = ROLES[user.role];
  if (config.allowedRoutes.includes('*')) return true;
  return config.allowedRoutes.some((r) => path.startsWith(r));
}
