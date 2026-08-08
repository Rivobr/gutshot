import type { AdminRole, AdminUserDto } from '@gutshot/types';

const ADMIN_KEY = 'gutshot_admin_profile';

export const adminSession = {
  get(): AdminUserDto | null {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AdminUserDto;
    } catch {
      return null;
    }
  },
  set(admin: AdminUserDto): void {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },
  clear(): void {
    localStorage.removeItem(ADMIN_KEY);
  },
  role(): AdminRole | null {
    return this.get()?.role ?? null;
  },
  isDealer(): boolean {
    return this.role() === 'DEALER';
  },
};
