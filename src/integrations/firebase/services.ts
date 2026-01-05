import { ref, get, set, remove, update } from 'firebase/database';
import { database } from './client';
import type { Member, GymPackage, Attendance } from './types';

// Helper to generate unique IDs
const generateId = () => crypto.randomUUID();

// Helper to get current timestamp
const now = () => new Date().toISOString();

// ===================== MEMBERS =====================

export const membersService = {
  async getAll(): Promise<Member[]> {
    const snapshot = await get(ref(database, 'members'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, member]) => ({ 
      ...(member as Omit<Member, 'id'>), 
      id 
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getById(id: string): Promise<Member | null> {
    const snapshot = await get(ref(database, `members/${id}`));
    if (!snapshot.exists()) return null;
    return { ...snapshot.val(), id };
  },

  async getByMemberId(memberId: string): Promise<Member | null> {
    const members = await this.getAll();
    return members.find(m => m.member_id === memberId.toUpperCase()) || null;
  },

  async create(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const id = generateId();
    const newMember: Member = {
      ...member,
      id,
      created_at: now(),
      updated_at: now(),
    };
    await set(ref(database, `members/${id}`), newMember);
    return newMember;
  },

  async update(id: string, updates: Partial<Member>): Promise<void> {
    await update(ref(database, `members/${id}`), {
      ...updates,
      updated_at: now(),
    });
  },

  async delete(id: string): Promise<void> {
    await remove(ref(database, `members/${id}`));
  },

  async generateMemberId(): Promise<string> {
    const members = await this.getAll();
    let counter = 1;
    while (true) {
      const newId = 'RF' + counter.toString().padStart(4, '0');
      if (!members.some(m => m.member_id === newId)) {
        return newId;
      }
      counter++;
    }
  },

  async getExpiringMembers(days: number = 7): Promise<Member[]> {
    const members = await this.getAll();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return members.filter(m => {
      if (!m.is_active || !m.package_end_date) return false;
      const endDate = new Date(m.package_end_date);
      return endDate >= today && endDate <= futureDate;
    }).sort((a, b) => new Date(a.package_end_date!).getTime() - new Date(b.package_end_date!).getTime());
  },
};

// ===================== PACKAGES =====================

export const packagesService = {
  async getAll(): Promise<GymPackage[]> {
    const snapshot = await get(ref(database, 'gym_packages'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, pkg]) => ({ 
      ...(pkg as Omit<GymPackage, 'id'>), 
      id 
    })).sort((a, b) => a.price - b.price);
  },

  async getActive(): Promise<GymPackage[]> {
    const packages = await this.getAll();
    return packages.filter(p => p.is_active);
  },

  async getById(id: string): Promise<GymPackage | null> {
    const snapshot = await get(ref(database, `gym_packages/${id}`));
    if (!snapshot.exists()) return null;
    return { ...snapshot.val(), id };
  },

  async create(pkg: Omit<GymPackage, 'id' | 'created_at'>): Promise<GymPackage> {
    const id = generateId();
    const newPackage: GymPackage = {
      ...pkg,
      id,
      created_at: now(),
    };
    await set(ref(database, `gym_packages/${id}`), newPackage);
    return newPackage;
  },

  async update(id: string, updates: Partial<GymPackage>): Promise<void> {
    await update(ref(database, `gym_packages/${id}`), updates);
  },

  async delete(id: string): Promise<void> {
    await remove(ref(database, `gym_packages/${id}`));
  },
};

// ===================== ATTENDANCE =====================

export const attendanceService = {
  async getAll(): Promise<Attendance[]> {
    const snapshot = await get(ref(database, 'attendance'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, record]) => ({ 
      ...(record as Omit<Attendance, 'id'>), 
      id 
    })).sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime());
  },

  async getByMemberId(memberId: string, limit?: number): Promise<Attendance[]> {
    const all = await this.getAll();
    const filtered = all.filter(a => a.member_id === memberId);
    return limit ? filtered.slice(0, limit) : filtered;
  },

  async getRecent(limit: number = 10): Promise<Attendance[]> {
    const all = await this.getAll();
    return all.slice(0, limit);
  },

  async create(record: Omit<Attendance, 'id' | 'created_at' | 'check_in_time'>): Promise<Attendance> {
    const id = generateId();
    const newRecord: Attendance = {
      ...record,
      id,
      check_in_time: now(),
      created_at: now(),
    };
    await set(ref(database, `attendance/${id}`), newRecord);
    return newRecord;
  },

  async getCountSince(date: Date): Promise<number> {
    const all = await this.getAll();
    return all.filter(a => new Date(a.check_in_time) >= date).length;
  },

  async getRecordsSince(date: Date): Promise<Attendance[]> {
    const all = await this.getAll();
    return all.filter(a => new Date(a.check_in_time) >= date);
  },
};

// ===================== STORAGE (using Supabase for now) =====================
// Note: File storage will continue to use Supabase since Firebase config doesn't include storage

export const storageService = {
  // We'll keep using Supabase storage for photos since it's already configured
  // Firebase Realtime Database doesn't include storage
};
