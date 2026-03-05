# Supabase Keys Usage Report

## Overview
This document maps where Supabase Anonymous Key and Service Role Key are used throughout the project.

---

## 🔑 PUBLISHABLE KEY Usage (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

### Purpose
- Used for **client-side** authentication and queries
- Respects Row Level Security (RLS) policies
- Safe to expose in browser/client code
- Limited permissions based on authenticated user

### Files Using Anon Key:

#### 1. **Client-Side Supabase Instances**

**`utils/supabaseClient.ts`**
- Main client-side Supabase instance
- Used throughout the application for client queries
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**`utils/supabase/client.tsx`**
- Browser client creation
- Used in client components
```typescript
createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

**`services/supabase.tsx`**
- Service layer Supabase client
```typescript
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
```

**`components/SettingsComponent.tsx`**
- Settings component Supabase client
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 2. **Middleware & Server Components**

**`utils/supabase/middleware.tsx`**
- Middleware for authentication
- Server-side request handling
```typescript
createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { cookies: {...} }
)
```

**`utils/supabase/server.tsx`**
- Server component Supabase client
- Uses anon key (not service role)
```typescript
createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // ✅ publishable key
  { cookies: {...} }
)
```

#### 3. **Edge Function Calls**

**`components/Appointment/Add_Appointment_Modal/index.tsx`**
- Calls Supabase Edge Functions
- Uses anon key for authorization header
```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/create-appointment-mcm`, {
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
  }
});
```
- Used in 2 places:
  - Coming back patient appointment creation (line 365)
  - New patient appointment creation (line 464)

---

## 🔐 SERVICE ROLE KEY Usage

### Purpose
- Used for **server-side** operations with elevated privileges
- **BYPASSES** Row Level Security (RLS)
- Should **NEVER** be exposed to client/browser
- Full database access

### ⚠️ Security Issue Found
Some files use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` which exposes the service key to the client. This is a **CRITICAL SECURITY RISK**.

---

### Files Using Service Role Key:

#### 1. **API Routes (Correct Usage - Server-Side Only)**

**`app/api/forms/route.ts`**
- Medical forms CRUD operations
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅
- Operations: GET, POST, PUT, DELETE
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**`app/api/tools/pharmacy/route.ts`**
- Pharmacy management
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅
- Operations: GET, POST

**`app/api/tools/pharmacy/[id]/route.ts`**
- Individual pharmacy operations
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅
- Operations: PUT, DELETE

**`app/api/tools/specials/[id]/route.ts`**
- Specials management
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅
- Operations: DELETE

**`app/api/stockpanel-AI/route.ts`**
- AI stock panel operations
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅

**`app/api/reminder/route.ts`**
- Reminder/notification system
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅
```typescript
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**`app/api/bonuses/save/route.ts`**
- Bonus calculations and saving
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅

**`app/api/email-reply/webhook/route.ts`**
- Email webhook handler
- Uses: `SUPABASE_SERVICE_ROLE_KEY` ✅

**`app/api/sync/db-test/route.ts`**
- Database sync testing
- Checks for: `SUPABASE_SERVICE_ROLE_KEY` ✅

#### 2. **Admin API Routes (Correct Usage)**

**`app/api/admin/users/route.ts`**
- User management (create, list)
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️ (should be server-only)

**`app/api/admin/users/change-password/route.tsx`**
- Password management
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️

**`app/api/admin/users/actions/edit/route.ts`**
- User editing
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️

**`app/api/admin/users/actions/delete/route.ts`**
- User deletion
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️

#### 3. **Upload Routes (Security Risk)**

**`app/api/upload-profile/route.ts`**
- Profile image uploads
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️ **EXPOSED TO CLIENT**
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // ⚠️ SECURITY RISK
)
```

**`app/api/upload-special/route.ts`**
- Special image uploads
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️ **EXPOSED TO CLIENT**

#### 4. **Cron Jobs**

**`app/api/cron/send-reports/route.ts`**
- Scheduled report sending
- Uses: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️
```typescript
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

#### 5. **Database Sync (Child Database)**

**`utils/sync/directDbSync.ts`**
- Syncs data to child database
- Uses: `CHILD_SUPABASE_SERVICE_ROLE_KEY` ✅
```typescript
this.childSupabase = createClient(
  process.env.CHILD_SUPABASE_URL!,
  process.env.CHILD_SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## 🚨 SECURITY ISSUES FOUND

### Critical Issues:

1. **`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` Usage**
   - Files using this variable expose the service role key to the client
   - This is a **CRITICAL SECURITY VULNERABILITY**
   - Affected files:
     - `app/api/upload-profile/route.ts`
     - `app/api/upload-special/route.ts`
     - `app/api/cron/send-reports/route.ts`
     - `app/api/admin/users/route.ts`
     - `app/api/admin/users/change-password/route.tsx`
     - `app/api/admin/users/actions/edit/route.ts`
     - `app/api/admin/users/actions/delete/route.ts`

### Recommendations:

1. **Replace all `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` with `SUPABASE_SERVICE_ROLE_KEY`**
   - Remove the `NEXT_PUBLIC_` prefix
   - This ensures the key is only available server-side

2. **Rotate Service Role Key**
   - Since the key may have been exposed, rotate it in Supabase dashboard
   - Update `.env.local` with new key

3. **Review RLS Policies**
   - Ensure proper Row Level Security policies are in place
   - Don't rely solely on service role key for security

---

## 📊 Summary Statistics

### Anon Key Usage:
- **Note**: Migrated to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Client-side instances**: 4 files
- **Middleware/Server**: 2 files
- **Edge function calls**: 1 file (2 locations)
- **Total**: 7 files

### Service Role Key Usage:
- **API routes (correct)**: 10 files
- **API routes (exposed)**: 7 files ⚠️
- **Database sync**: 1 file
- **Total**: 18 files

### Security Risk Level:
- **Critical**: 7 files using `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- **Safe**: 11 files using `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔧 Environment Variables Required

```env
# Client-side (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Server-side only (NEVER expose)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Child database sync (server-side only)
CHILD_SUPABASE_URL=your_child_db_url
CHILD_SUPABASE_SERVICE_ROLE_KEY=your_child_service_key

# ⚠️ REMOVE THIS - Security Risk
# NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=DO_NOT_USE
```

---

## ✅ Action Items

1. [ ] Replace all `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` with `SUPABASE_SERVICE_ROLE_KEY`
2. [ ] Remove `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
3. [ ] Rotate service role key in Supabase dashboard
4. [ ] Update all affected API routes
5. [ ] Test all functionality after changes
6. [ ] Review and strengthen RLS policies
7. [ ] Add security audit to CI/CD pipeline

---

Generated: $(date)
