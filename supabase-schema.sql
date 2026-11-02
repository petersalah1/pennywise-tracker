-- ================================================================
-- مشروع بيني وايز (Pennywise) - ملف إعداد قاعدة بيانات Supabase
-- قم بنسخ هذا الكود بالكامل ولصقه في:
-- Supabase Dashboard -> SQL Editor -> New Query -> اضغط Run
-- ================================================================

-- 1. جدول الملف الشخصي (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_name text not null default 'بيتر صلاح',
  opening_balance numeric not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. جدول المحافظ ومصادر الأموال (Wallets)
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null default 'cash',
  initial_balance numeric not null default 0,
  color text not null default '#10B981',
  icon text default 'wallet',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. جدول التصنيفات (Categories)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text default 'tag',
  budget numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. جدول المعاملات المالية (Transactions)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  wallet_id uuid references public.wallets(id) on delete set null,
  to_wallet_id uuid references public.wallets(id) on delete set null,
  title text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  date text not null, -- صيغة YYYY-MM-DD
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ================================================================
-- تفعيل جدار الحماية والأمان (Row Level Security - RLS)
-- ================================================================
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- سياسات جدول profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- سياسات جدول wallets
create policy "Users can view their own wallets" on public.wallets for select using (auth.uid() = user_id);
create policy "Users can insert their own wallets" on public.wallets for insert with check (auth.uid() = user_id);
create policy "Users can update their own wallets" on public.wallets for update using (auth.uid() = user_id);
create policy "Users can delete their own wallets" on public.wallets for delete using (auth.uid() = user_id);

-- سياسات جدول categories
create policy "Users can view their own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert their own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on public.categories for delete using (auth.uid() = user_id);

-- سياسات جدول transactions
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert their own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update their own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete their own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- ================================================================
-- دالة وتريجر لإنشاء الملف الشخصي والمحافظ والتصنيفات الافتراضية
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_name text;
begin
  default_name := coalesce(new.raw_user_meta_data->>'user_name', 'بيتر صلاح');
  
  -- إنشاء الملف الشخصي
  insert into public.profiles (id, user_name, opening_balance)
  values (new.id, default_name, 0);

  -- إنشاء المحافظ الافتراضية
  insert into public.wallets (user_id, name, type, initial_balance, color, icon) values
    (new.id, 'كاش (المحفظة)', 'cash', 0, '#10B981', 'wallet'),
    (new.id, 'حساب بنكي', 'bank', 0, '#38BDF8', 'building-2'),
    (new.id, 'إنستاباي (InstaPay)', 'instapay', 0, '#A855F7', 'zap'),
    (new.id, 'محفظة إلكترونية (فودافون كاش)', 'e-wallet', 0, '#EF4444', 'smartphone');

  -- إنشاء التصنيفات الافتراضية العربية للمستخدم الجديد
  insert into public.categories (user_id, name, type, color, icon, budget) values
    (new.id, 'طعام ومشروبات', 'expense', '#F59E0B', 'utensils', 4000),
    (new.id, 'مواصلات ووقود', 'expense', '#38BDF8', 'car-front', 1500),
    (new.id, 'تسوق ومشتريات', 'expense', '#C084FC', 'shopping-bag', 2000),
    (new.id, 'فواتير والتزامات', 'expense', '#FB7185', 'receipt', 2500),
    (new.id, 'صحة وعلاج', 'expense', '#34D399', 'heart-pulse', 1000),
    (new.id, 'مصاريف أخرى', 'expense', '#94A3B8', 'ellipsis', null),
    (new.id, 'راتب شهري', 'income', '#34D399', 'briefcase-business', null),
    (new.id, 'عمل حر (Freelance)', 'income', '#60A5FA', 'laptop', null),
    (new.id, 'مكافآت وهدايا', 'income', '#F472B6', 'gift', null),
    (new.id, 'دخل إضافي آخر', 'income', '#A3A3A3', 'plus-circle', null);

  return new;
end;
$$ language plpgsql security definer;

-- تفعيل الـ Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
