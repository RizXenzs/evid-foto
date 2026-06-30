-- ============================================
-- EvidFoto - Database Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FOLDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  location TEXT,
  work_date DATE,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete', 'restore', 'move', 'login', 'create_folder', 'delete_folder', 'update_profile')),
  target_type TEXT CHECK (target_type IN ('photo', 'folder', 'user')),
  target_id UUID,
  target_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOWNLOAD HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.download_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
  download_type TEXT NOT NULL CHECK (download_type IN ('single', 'bulk')),
  file_count INTEGER DEFAULT 1,
  file_names TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON public.photos(folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON public.photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_work_date ON public.photos(work_date);
CREATE INDEX IF NOT EXISTS idx_photos_is_deleted ON public.photos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON public.photos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON public.folders(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_history_user_id ON public.download_history(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES POLICIES
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- FOLDERS POLICIES
CREATE POLICY "Authenticated users can view non-deleted folders" ON public.folders
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = false);

CREATE POLICY "Admins can view deleted folders" ON public.folders
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert folders" ON public.folders
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update folders" ON public.folders
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete folders" ON public.folders
  FOR DELETE USING (public.get_user_role() = 'admin');

-- PHOTOS POLICIES
CREATE POLICY "Authenticated users can view non-deleted photos" ON public.photos
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = false);

CREATE POLICY "Admins can view deleted photos" ON public.photos
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert photos" ON public.photos
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update photos" ON public.photos
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete photos" ON public.photos
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ACTIVITY LOGS POLICIES
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can view own activity" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- DOWNLOAD HISTORY POLICIES
CREATE POLICY "Users can view own download history" ON public.download_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all download history" ON public.download_history
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Authenticated users can insert download history" ON public.download_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for photos bucket
-- CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
-- CREATE POLICY "Admins can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND public.get_user_role() = 'admin');
-- CREATE POLICY "Admins can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND public.get_user_role() = 'admin');

-- Storage policies for avatars bucket
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

-- ============================================
-- SEED ADMIN USER (update after signup)
-- ============================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@evidfoto.com';
