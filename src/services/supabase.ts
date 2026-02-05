import { supabase } from "@/integrations/supabase/client";

// Types
export interface Member {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  weight: number | null;
  height: number | null;
  package_id: string | null;
  package_start_date: string | null;
  package_end_date: string | null;
  photo_url: string | null;
  is_active: boolean | null;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  gym_packages?: GymPackage | null;
}

export interface GymPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  is_active: boolean | null;
  created_at: string | null;
}

export interface Attendance {
  id: string;
  member_id: string;
  check_in_time: string | null;
  qr_code_used: string | null;
  created_at: string | null;
}

export interface TransformationPhoto {
  id: string;
  member_id: string;
  photo_url: string;
  photo_date: string;
  notes: string | null;
  weight: number | null;
  created_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category_id: string | null;
  tags: string[];
  is_featured: boolean;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  blog_categories?: BlogCategory | null;
}

// ===================== MEMBERS =====================

export const membersService = {
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select("*, gym_packages(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from("members")
      .select("*, gym_packages(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getByMemberId(memberId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from("members")
      .select("*, gym_packages(*)")
      .eq("member_id", memberId.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(member: Omit<Member, "id" | "created_at" | "updated_at" | "gym_packages">): Promise<Member> {
    const { data, error } = await supabase
      .from("members")
      .insert(member)
      .select("*, gym_packages(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Member>): Promise<void> {
    const { error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async generateMemberId(): Promise<string> {
    const { data, error } = await supabase.rpc("generate_member_id");
    if (error) throw error;
    return data;
  },

  async getExpiringMembers(days: number = 7): Promise<Member[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const { data, error } = await supabase
      .from("members")
      .select("*, gym_packages(*)")
      .eq("is_active", true)
      .gte("package_end_date", today.toISOString().split("T")[0])
      .lte("package_end_date", futureDate.toISOString().split("T")[0])
      .order("package_end_date", { ascending: true });
    if (error) throw error;
    return data || [];
  },
};

// ===================== PACKAGES =====================

export const packagesService = {
  async getAll(): Promise<GymPackage[]> {
    const { data, error } = await supabase
      .from("gym_packages")
      .select("*")
      .order("price", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getActive(): Promise<GymPackage[]> {
    const { data, error } = await supabase
      .from("gym_packages")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<GymPackage | null> {
    const { data, error } = await supabase
      .from("gym_packages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(pkg: Omit<GymPackage, "id" | "created_at">): Promise<GymPackage> {
    const { data, error } = await supabase
      .from("gym_packages")
      .insert(pkg)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<GymPackage>): Promise<void> {
    const { error } = await supabase
      .from("gym_packages")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("gym_packages")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// ===================== ATTENDANCE =====================

export const attendanceService = {
  async getAll(): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("check_in_time", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByMemberId(memberId: string, limit?: number): Promise<Attendance[]> {
    let query = supabase
      .from("attendance")
      .select("*")
      .eq("member_id", memberId)
      .order("check_in_time", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getRecent(limit: number = 10): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("check_in_time", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<Attendance, "id" | "created_at" | "check_in_time">): Promise<Attendance> {
    const { data, error } = await supabase
      .from("attendance")
      .insert({
        ...record,
        check_in_time: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getCountSince(date: Date): Promise<number> {
    const { count, error } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("check_in_time", date.toISOString());
    if (error) throw error;
    return count || 0;
  },

  async getRecordsSince(date: Date): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .gte("check_in_time", date.toISOString())
      .order("check_in_time", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

// ===================== TRANSFORMATION PHOTOS =====================
// Note: Photos are stored in Supabase storage, metadata in a virtual table
// Since there's no transformation_photos table, we'll use Supabase storage metadata

export const transformationPhotosService = {
  async getByMemberId(memberId: string): Promise<TransformationPhoto[]> {
    // List files from the member's folder in storage
    const { data: files, error } = await supabase.storage
      .from("member-photos")
      .list(`transformations/${memberId}`, {
        sortBy: { column: "created_at", order: "asc" },
      });
    
    if (error || !files) return [];
    
    // Convert storage files to TransformationPhoto format
    return files
      .filter(file => file.name !== ".emptyFolderPlaceholder")
      .map(file => {
        const publicUrl = supabase.storage
          .from("member-photos")
          .getPublicUrl(`transformations/${memberId}/${file.name}`).data.publicUrl;
        
        // Parse metadata from filename if stored that way, or use defaults
        const createdAt = file.created_at || new Date().toISOString();
        
        return {
          id: file.id || file.name,
          member_id: memberId,
          photo_url: publicUrl,
          photo_date: createdAt.split("T")[0],
          notes: null,
          weight: null,
          created_at: createdAt,
        };
      });
  },

  async create(photo: Omit<TransformationPhoto, "id" | "created_at">): Promise<TransformationPhoto> {
    // This is handled by direct upload in the component
    // Just return a placeholder - actual upload happens in component
    return {
      ...photo,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  },

  async delete(photoPath: string): Promise<void> {
    const { error } = await supabase.storage
      .from("member-photos")
      .remove([photoPath]);
    if (error) throw error;
  },
};

// ===================== BLOG =====================

export const blogService = {
  async getCategories(): Promise<BlogCategory[]> {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async getPublishedPosts(limit?: number): Promise<BlogPost[]> {
    let query = supabase
      .from("blog_posts")
      .select("*, blog_categories(*)")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getFeaturedPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, blog_categories(*)")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(3);
    if (error) throw error;
    return data || [];
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, blog_categories(*)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, blog_categories(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createPost(post: Omit<BlogPost, "id" | "created_at" | "updated_at" | "blog_categories">): Promise<BlogPost> {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(post)
      .select("*, blog_categories(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    const { error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async createCategory(category: Omit<BlogCategory, "id" | "created_at">): Promise<BlogCategory> {
    const { data, error } = await supabase
      .from("blog_categories")
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ===================== STORAGE =====================

export const storageService = {
  async uploadPhoto(file: File, path?: string): Promise<string> {
    const fileName = path || `${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    return supabase.storage.from("member-photos").getPublicUrl(fileName).data.publicUrl;
  },

  async uploadBlogImage(file: File): Promise<string> {
    const fileName = `blog/${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    return supabase.storage.from("member-photos").getPublicUrl(fileName).data.publicUrl;
  },
};

// ===================== SEED DATA =====================

export const seedSampleData = async (): Promise<void> => {
  const packages = await packagesService.getAll();
  if (packages.length > 0) {
    throw new Error("Sample data already exists!");
  }

  const samplePackages = [
    { name: "Monthly Basic", description: "Access to gym equipment", price: 999, duration_months: 1, is_active: true },
    { name: "Quarterly Premium", description: "Gym + Personal trainer sessions", price: 2499, duration_months: 3, is_active: true },
    { name: "Half-Yearly Pro", description: "All facilities + diet plan", price: 4499, duration_months: 6, is_active: true },
    { name: "Annual Elite", description: "Complete fitness package", price: 7999, duration_months: 12, is_active: true },
  ];

  for (const pkg of samplePackages) {
    await packagesService.create(pkg);
  }
};
