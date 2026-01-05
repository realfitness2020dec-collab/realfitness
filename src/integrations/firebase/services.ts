import { ref, get, set, remove, update } from 'firebase/database';
import { database } from './client';
import type { Member, GymPackage, Attendance, TransformationPhoto } from './types';

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

// ===================== TRANSFORMATION PHOTOS =====================

export const transformationPhotosService = {
  async getAll(): Promise<TransformationPhoto[]> {
    const snapshot = await get(ref(database, 'transformation_photos'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, photo]) => ({ 
      ...(photo as Omit<TransformationPhoto, 'id'>), 
      id 
    })).sort((a, b) => new Date(b.photo_date).getTime() - new Date(a.photo_date).getTime());
  },

  async getByMemberId(memberId: string): Promise<TransformationPhoto[]> {
    const all = await this.getAll();
    return all.filter(p => p.member_id === memberId)
      .sort((a, b) => new Date(a.photo_date).getTime() - new Date(b.photo_date).getTime());
  },

  async create(photo: Omit<TransformationPhoto, 'id' | 'created_at'>): Promise<TransformationPhoto> {
    const id = generateId();
    const newPhoto: TransformationPhoto = {
      ...photo,
      id,
      created_at: now(),
    };
    await set(ref(database, `transformation_photos/${id}`), newPhoto);
    return newPhoto;
  },

  async delete(id: string): Promise<void> {
    await remove(ref(database, `transformation_photos/${id}`));
  },
};

// ===================== SEED DATA =====================

export const seedSampleData = async (): Promise<void> => {
  // Check if data already exists
  const existingPackages = await packagesService.getAll();
  if (existingPackages.length > 0) {
    throw new Error('Sample data already exists!');
  }

  // Create packages
  const packages = [
    { name: 'Monthly Basic', description: 'Access to gym equipment', price: 999, duration_months: 1, is_active: true },
    { name: 'Quarterly Premium', description: 'Gym + Personal trainer sessions', price: 2499, duration_months: 3, is_active: true },
    { name: 'Half-Yearly Pro', description: 'All facilities + diet plan', price: 4499, duration_months: 6, is_active: true },
    { name: 'Annual Elite', description: 'Complete fitness package', price: 7999, duration_months: 12, is_active: true },
  ];

  const createdPackages: GymPackage[] = [];
  for (const pkg of packages) {
    const created = await packagesService.create(pkg);
    createdPackages.push(created);
  }

  // Create sample members
  const sampleMembers = [
    { full_name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', weight: 75, height: 175 },
    { full_name: 'Priya Patel', phone: '9876543211', email: 'priya@example.com', weight: 58, height: 162 },
    { full_name: 'Amit Kumar', phone: '9876543212', email: 'amit@example.com', weight: 82, height: 180 },
  ];

  for (let i = 0; i < sampleMembers.length; i++) {
    const member = sampleMembers[i];
    const memberId = await membersService.generateMemberId();
    const pkg = createdPackages[i % createdPackages.length];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + pkg.duration_months);

    await membersService.create({
      member_id: memberId,
      full_name: member.full_name,
      phone: member.phone,
      email: member.email,
      address: null,
      weight: member.weight,
      height: member.height,
      package_id: pkg.id,
      package_start_date: startDate.toISOString().split('T')[0],
      package_end_date: endDate.toISOString().split('T')[0],
      photo_url: null,
      is_active: true,
      user_id: null,
    });
  }
};

// ===================== STORAGE (using Supabase for now) =====================
// Note: File storage will continue to use Supabase since Firebase config doesn't include storage

export const storageService = {
  // We'll keep using Supabase storage for photos since it's already configured
  // Firebase Realtime Database doesn't include storage
};
