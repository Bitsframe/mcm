# JWT Token Usage Report

## Overview

This document details all JWT (JSON Web Token) usage throughout the project, including where tokens are generated, stored, and used.

---

## 🔑 JWT Token Types in Project

### 1. **Supabase JWT Tokens** (Primary Authentication)
- **Purpose**: User authentication and authorization
- **Provider**: Supabase Auth
- **Type**: Access tokens and refresh tokens

### 2. **Third-Party API Tokens**
- **Facebook Access Token**: For Facebook Graph API
- **SmartyStreets Auth Token**: For address validation
- **Resend API Key**: For email sending
- **OpenAI API Key**: For AI features

---

## 📍 Supabase JWT Token Usage

### 1. **Token Generation**

#### `app/api/get-jwt/route.ts`
**Purpose**: Get Supabase access token for authenticated user

**Path**: `/api/get-jwt`  
**Method**: GET  
**Returns**: `{ token: session.access_token }`

```typescript
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new Response(JSON.stringify({ error: "Not logged in" }), {
      status: 401,
    });
  }
  
  return new Response(JSON.stringify({ token: session.access_token }), {
    status: 200,
  });
}
```

**Usage**: Provides JWT token to client-side for authenticated API calls

---

### 2. **Token Storage**

#### Client-Side Storage
**File**: `app/[locale]/(root)/(childroot)/tools/settings/profile/page.tsx`

**Location**: `localStorage.getItem('authToken')`

```typescript
const token = localStorage.getItem('authToken') || '';

const res = await fetch('/api/upload-profile', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Purpose**: Store JWT token in browser for authenticated requests

---

### 3. **Token Usage in Authentication**

#### Session Management Files:

1. **`middleware.ts`**
   - **Purpose**: Middleware authentication check
   - **Usage**: `await supabase.auth.getSession()`
   - **Function**: Validates user session on protected routes

2. **`utils/supabase/middleware.tsx`**
   - **Purpose**: Refresh session and sync cookies
   - **Usage**: `await supabase.auth.getUser()`
   - **Function**: Maintains active session

3. **`actions/supabase_auth/action.tsx`**
   - **Purpose**: Sign in/out actions
   - **Functions**:
     - `signInWithPassword()` - Login
     - `getSession()` - Get current session
     - `signOut()` - Logout
     - `refreshSession()` - Refresh tokens

---

### 4. **Token Usage in API Routes**

#### Files Using JWT for Authentication:

1. **`app/api/user/route.ts`**
   ```typescript
   const { data, error } = await supabase.auth.getUser();
   ```
   - **Purpose**: Get current user profile
   - **Authentication**: Required

2. **`app/api/update-profile/route.ts`**
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   ```
   - **Purpose**: Update user profile
   - **Authentication**: Required

3. **`app/api/sales-team/route.ts`**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   ```
   - **Purpose**: Get sales team data
   - **Authentication**: Required

4. **`app/api/sales-team/reset/route.ts`**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   ```
   - **Purpose**: Reset sales team data
   - **Authentication**: Required

5. **`app/api/orders/route.ts`**
   ```typescript
   const { data: { user } } = await serverSupabase.auth.getUser();
   ```
   - **Purpose**: Create/manage orders
   - **Authentication**: Required (2 locations)

---

### 5. **Token Usage in Data Services**

#### `utils/supabase/data_services/data_services.tsx`

**Location-Based Filtering** (2 locations):

```typescript
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  const { data: userLocations } = await supabase
    .from('user_locations')
    .select('location_id')
    .eq('profile_id', user.id);
}
```

**Purpose**: Filter data based on user's assigned locations

**Used in**:
- `fetch_content_service()` - Line 193
- `update_content_service()` - Line 296

---

### 6. **Token Usage in Components**

#### `components/POS/PosFields.tsx`

**Multiple Authentication Methods** (Backward compatibility):

```typescript
// Try getSession (v2)
if (supabase.auth && typeof (supabase.auth as any).getSession === "function") {
  const { data: sessionData } = await (supabase.auth as any).getSession();
  userId = sessionData?.session?.user?.id ?? null;
}

// Try getUser (v2)
if (!userId && supabase.auth && typeof (supabase.auth as any).getUser === "function") {
  const { data } = await (supabase.auth as any).getUser();
  userId = data?.user?.id ?? null;
}

// Try user() (v1)
if (!userId && supabase.auth && typeof (supabase.auth as any).user === "function") {
  const user = (supabase.auth as any).user();
  userId = user?.id ?? null;
}
```

**Purpose**: Get authenticated user ID for POS operations

---

### 7. **Token Usage in Edge Functions**

#### `components/Appointment/Add_Appointment_Modal/index.tsx`

**Edge Function Authorization** (2 locations):

```typescript
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const response = await fetch(`${supabaseUrl}/functions/v1/create-appointment-mcm`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabasePublishableKey}`,
  },
  body: JSON.stringify({...})
});
```

**Purpose**: Authorize calls to Supabase Edge Functions

**Locations**:
- Line 365: Coming back patient appointment
- Line 464: New patient appointment

---

### 8. **Token in Database Functions**

#### `supabase/migrations/20251225131905_remote_schema.sql`

**JWT Email Extraction**:

```sql
BEGIN
  NEW.auth_member := auth.uid();
  NEW.auth_email := auth.jwt()->>'email';
  RETURN NEW;
END;
```

**Purpose**: Extract email from JWT token in database trigger

**Database Functions Using JWT**:
- Line 3860: `auth.jwt()->>'email'` - Extract email from token
- Line 3056: Optional Bearer token header comment
- Line 3753: Bearer token in Edge Function call
- Line 3787: Bearer token in Edge Function call
- Line 12167: Bearer token in webhook call

---

## 🔐 JWT Configuration

### Supabase Config (`supabase/config.toml`)

```toml
# How long tokens are valid for, in seconds
jwt_expiry = 3600  # 1 hour

# If disabled, the refresh token will never expire
enable_refresh_token_rotation = true

# Allows refresh tokens to be reused after expiry
refresh_token_reuse_interval = 10

# Rate limiting
token_refresh = 150  # per 5 minutes per IP
token_verifications = 30  # per 5 minutes per IP

# Custom access token hook (commented out)
# [auth.hook.custom_access_token]
# enabled = true
# uri = "pg-functions://<database>/<schema>/<hook_name>"

# Edge function JWT verification
[functions.send-email]
enabled = true
verify_jwt = true
```

---

## 🌐 Third-Party API Tokens

### 1. **Facebook Access Token**

**File**: `utils/facebook.ts`

```typescript
const access_token = "EAATLOZASILrMBO4BqJYX2Qn65r057776EsgNaLwZABOnv1ZB1yxi9AQyxeXl2y4dfTTdMqfRk9ahlZA8dq56MuJbpnTXBmQIz75K2ENp0Nsnw7SpsQD1r3ZCNZAoOMroTAzVvZCOOwAludlPElp2UEidaBFAw68bQikZBM7oLT4ccFwlU39pQKZB6ZBnQ1bT6kqb1zcjn5o79FZCyr5WGDD1W2hZAkRyPcsiiaa2ugfHHIDknwZDZD"

// Usage in API calls
const url = `https://graph.facebook.com/v18.0/2192126740832304/insights/${query}?access_token=${access_token}`;
```

**Purpose**: Facebook Graph API authentication  
**⚠️ Security Issue**: Hardcoded token in source code

---

### 2. **SmartyStreets Auth Token**

**File**: `.env.local`

```env
SMARTY_AUTH_ID=211981a0-11c6-2f7b-b2ad-af56f01bc9bc
SMARTY_AUTH_TOKEN=llKx23SYzySyx07blz0U
```

**Usage**: Address validation API

**Documentation**: `smartly` file

```typescript
const authId = process.env.SMARTY_AUTH_ID;
const authToken = process.env.SMARTY_AUTH_TOKEN;

const url = `https://us-autocomplete-pro.api.smarty.com/lookup?auth-id=${authId}&auth-token=${authToken}&search=${search}`;
```

---

### 3. **Resend API Key**

**File**: `supabase/functions/send-email/index.ts`

```typescript
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

await fetch('https://api.resend.com/emails', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({...})
});
```

**Purpose**: Email sending service

---

### 4. **OpenAI API Key**

**File**: `app/api/stockpanel-AI/route.ts`

```typescript
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

await fetch("https://api.openai.com/v1/chat/completions", {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({...})
});
```

**Purpose**: AI-powered stock panel features

---

## 📊 Token Usage Summary

### Supabase JWT Tokens:

| File | Purpose | Method | Authentication |
|------|---------|--------|----------------|
| `app/api/get-jwt/route.ts` | Get access token | `getSession()` | Required |
| `middleware.ts` | Route protection | `getSession()` | Check |
| `utils/supabase/middleware.tsx` | Session refresh | `getUser()` | Refresh |
| `actions/supabase_auth/action.tsx` | Sign in/out | Multiple | Auth flow |
| `app/api/user/route.ts` | User profile | `getUser()` | Required |
| `app/api/update-profile/route.ts` | Update profile | `getUser()` | Required |
| `app/api/sales-team/route.ts` | Sales data | `getUser()` | Required |
| `app/api/sales-team/reset/route.ts` | Reset sales | `getUser()` | Required |
| `app/api/orders/route.ts` | Order management | `getUser()` | Required |
| `utils/supabase/data_services/data_services.tsx` | Data filtering | `getUser()` | Location-based |
| `components/POS/PosFields.tsx` | POS operations | Multiple | User ID |
| `components/Appointment/Add_Appointment_Modal/index.tsx` | Edge functions | Publishable key | Authorization |
| `app/[locale]/(root)/(childroot)/tools/settings/profile/page.tsx` | File upload | localStorage | Bearer token |

**Total Files Using Supabase JWT**: 13 files

---

### Third-Party Tokens:

| Token Type | File | Purpose | Storage |
|------------|------|---------|---------|
| Facebook Access Token | `utils/facebook.ts` | Graph API | Hardcoded ⚠️ |
| SmartyStreets Auth Token | `.env.local` | Address validation | Environment |
| Resend API Key | Edge function | Email sending | Environment |
| OpenAI API Key | `app/api/stockpanel-AI/route.ts` | AI features | Environment |

---

## 🔒 Security Considerations

### ✅ Good Practices:

1. **JWT Expiry**: Tokens expire after 1 hour
2. **Refresh Token Rotation**: Enabled for security
3. **Server-Side Validation**: Most routes validate tokens server-side
4. **Environment Variables**: Most API keys stored in `.env.local`
5. **Edge Function Verification**: JWT verification enabled

### ⚠️ Security Issues:

1. **Hardcoded Facebook Token**: 
   - **File**: `utils/facebook.ts`
   - **Issue**: Access token hardcoded in source code
   - **Risk**: Token exposed in repository
   - **Fix**: Move to environment variable

2. **LocalStorage Token Storage**:
   - **File**: `app/[locale]/(root)/(childroot)/tools/settings/profile/page.tsx`
   - **Issue**: JWT stored in localStorage
   - **Risk**: Vulnerable to XSS attacks
   - **Recommendation**: Use httpOnly cookies instead

---

## 🎯 Token Flow Diagram

```
User Login
    ↓
Supabase Auth (signInWithPassword)
    ↓
Session Created (access_token + refresh_token)
    ↓
Token Stored in Cookies (httpOnly)
    ↓
Client Requests Protected Route
    ↓
Middleware Validates Session (getSession)
    ↓
API Route Validates User (getUser)
    ↓
Data Filtered by User Permissions
    ↓
Response Returned
```

---

## 📝 Recommendations

### 1. **Remove Hardcoded Facebook Token**

Move to environment variable:

```typescript
// utils/facebook.ts
const access_token = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN!;
```

### 2. **Avoid LocalStorage for JWT**

Use Supabase's built-in session management instead:

```typescript
// Instead of localStorage
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### 3. **Implement Token Refresh**

Ensure tokens are refreshed before expiry:

```typescript
await supabase.auth.refreshSession();
```

### 4. **Add Token Validation**

Validate tokens on sensitive operations:

```typescript
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 📚 Related Files

### Configuration:
- `supabase/config.toml` - JWT configuration
- `.env.local` - API tokens

### Authentication:
- `middleware.ts` - Route protection
- `utils/supabase/middleware.tsx` - Session management
- `actions/supabase_auth/action.tsx` - Auth actions

### API Routes:
- `app/api/get-jwt/route.ts` - Token generation
- `app/api/user/route.ts` - User data
- `app/api/orders/route.ts` - Order management

### Components:
- `components/POS/PosFields.tsx` - POS authentication
- `components/Appointment/Add_Appointment_Modal/index.tsx` - Edge function auth

---

Generated: $(date)
