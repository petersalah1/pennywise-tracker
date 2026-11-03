-- ================================================================
-- مشروع بيني وايز (Pennywise) - ملف تحديث وإصلاح قاعدة بيانات Supabase
-- قم بنسخ هذا الكود بالكامل ولصقه في:
-- Supabase Dashboard -> SQL Editor -> New Query -> اضغط Run
-- ================================================================

-- حذف الجداول السابقة لإعادة بنائها بالأنواع الصحيحة والمرنة
drop table if exists public.transactions cascade;
drop table if exists public.categories cascade;
drop table if exists public.wallets cascade;
drop table if exists public.profiles cascade;

-- 1. جدول الملف الشخصي (Profiles)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_name text not null default 'بيتر صلاح',
  opening_balance numeric not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. جدول المحافظ ومصادر الأموال (Wallets)
create table public.wallets (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null default 'cash',
  initial_balance numeric not null default 0,
  color text not null default '#10B981',
  icon text default 'wallet',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. جدول التصنيفات (Categories)
create table public.categories (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text default 'tag',
  budget numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. جدول المعاملات المالية (Transactions)
create table public.transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id text,
  wallet_id text,
  to_wallet_id text,
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

-- سياسات الوصول والحفظ لجميع الجداول
create policy "Users can manage their profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage their wallets" on public.wallets for all using (auth.uid() = user_id);
create policy "Users can manage their categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users can manage their transactions" on public.transactions for all using (auth.uid() = user_id);

-- ================================================================
-- دالة وتريجر لإنشاء الملف الشخصي والمحافظ والتصنيفات الافتراضية لأي مستخدم جديد
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_name text;
begin
  default_name := coalesce(new.raw_user_meta_data->>'user_name', 'بيتر صلاح');
  
  -- إنشاء الملف الشخصي
  insert into public.profiles (id, user_name, opening_balance)
  values (new.id, default_name, 0)
  on conflict (id) do nothing;

  -- إنشاء المحافظ الافتراضية
  insert into public.wallets (id, user_id, name, type, initial_balance, color, icon) values
    ('cash_' || new.id, new.id, 'كاش (المحفظة)', 'cash', 0, '#10B981', 'wallet'),
    ('bank_' || new.id, new.id, 'حساب بنكي', 'bank', 0, '#38BDF8', 'building-2'),
    ('instapay_' || new.id, new.id, 'إنستاباي (InstaPay)', 'instapay', 0, '#A855F7', 'zap'),
    ('ewallet_' || new.id, new.id, 'محفظة إلكترونية (فودافون كاش)', 'e-wallet', 0, '#EF4444', 'smartphone')
  on conflict (id) do nothing;

  -- إنشاء التصنيفات الافتراضية
  insert into public.categories (id, user_id, name, type, color, icon, budget) values
    ('food_' || new.id, new.id, 'طعام ومشروبات', 'expense', '#F59E0B', 'utensils', 4000),
    ('transport_' || new.id, new.id, 'مواصلات ووقود', 'expense', '#38BDF8', 'car-front', 1500),
    ('shopping_' || new.id, new.id, 'تسوق ومشتريات', 'expense', '#C084FC', 'shopping-bag', 2000),
    ('bills_' || new.id, new.id, 'فواتير والتزامات', 'expense', '#FB7185', 'receipt', 2500),
    ('health_' || new.id, new.id, 'صحة وعلاج', 'expense', '#34D399', 'heart-pulse', 1000),
    ('other-expense_' || new.id, new.id, 'مصاريف أخرى', 'expense', '#94A3B8', 'ellipsis', null),
    ('salary_' || new.id, new.id, 'راتب شهري', 'income', '#34D399', 'briefcase-business', null),
    ('freelance_' || new.id, new.id, 'عمل حر (Freelance)', 'income', '#60A5FA', 'laptop', null),
    ('gift_' || new.id, new.id, 'مكافآت وهدايا', 'income', '#F472B6', 'gift', null),
    ('other-income_' || new.id, new.id, 'دخل إضافي آخر', 'income', '#A3A3A3', 'plus-circle', null)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- تفعيل الـ Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
