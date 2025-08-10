# 🚀 Signup Feature Setup Guide

This guide will help you set up the new signup functionality for your Lead Generation Dashboard.

## 📋 Overview

The signup feature has been implemented with the following components:
- ✅ **Signup Page** (`/signup`) - User registration form
- ✅ **Updated Login Page** (`/login`) - Now includes "Sign up" link
- ✅ **React Router Integration** - Proper routing between pages
- ✅ **Supabase Auth Integration** - Creates both auth user and admin record
- ✅ **Auto-linking** - Links Supabase auth user with admin table entry


## 🔧 Required Database Changes

**IMPORTANT:** You need to update your admin table structure before the signup feature will work.

### Option 1: Quick Setup (Recommended)
Run this SQL in your Supabase SQL Editor:

```sql
-- Update admin table to use UUID instead of integer ID
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
DROP SEQUENCE IF EXISTS public.admins_id_seq CASCADE;
ALTER TABLE public.admins ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE public.admins ADD CONSTRAINT admins_pkey PRIMARY KEY (id);

-- Clear existing data (old integer IDs won't work)
TRUNCATE TABLE public.admins;

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can read own admin record" ON public.admins
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow signup to create admin records" ON public.admins
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Option 2: Manual Migration
If you have existing admin data you want to preserve, see `database-migration-admin-uuid.sql` for a more complex migration approach.

## 🎯 How It Works

### 1. **User Flow:**
```
1. User visits app → Redirected to /login
2. User clicks "Sign up" → Goes to /signup  
3. User fills form → Creates Supabase auth user + admin record
4. User redirected to /login with success message
5. User logs in → Enters dashboard
```

### 2. **Technical Flow:**
```
1. Signup form validates input
2. Calls authApi.signup() 
3. Creates Supabase auth user
4. Creates admin record with auth user's UUID
5. Links them using the UUID as primary key
```

### 3. **Security:**
- ✅ Password validation (min 6 characters)
- ✅ Email validation
- ✅ Form validation with error messages
- ✅ Row Level Security policies
- ✅ Auto-linking prevents orphaned records

## 🚀 Testing the Feature

### 1. **Start the Development Server:**
```bash
npm run dev
```

### 2. **Test Signup Flow:**
1. Navigate to `http://localhost:5173` 
2. You should be redirected to `/login`
3. Click "Sign up" button
4. Fill out the signup form:
   - Full Name: `Test User`
   - Email: `test@example.com` 
   - Password: `password123`
   - Confirm Password: `password123`

5. Click "Create Account"
6. Should redirect to login with success message
7. Login with the new credentials immediately

### 3. **Verify Database:**
Check your Supabase dashboard:
- **Auth > Users** - Should show the new user
- **Table Editor > admins** - Should show the admin record with matching UUID

## 🔍 Troubleshooting

### "Admin record not found" Error
- **Cause:** Admin table still uses integer ID instead of UUID
- **Fix:** Run the database update SQL above

### "Failed to create admin profile" Error  
- **Cause:** RLS policies or table permissions issue
- **Fix:** Check Supabase policies and table permissions

### Signup Button Not Working
- **Cause:** React Router not properly set up
- **Fix:** Make sure you installed `react-router-dom`

### Build Errors
- **Cause:** TypeScript errors or missing dependencies
- **Fix:** Run `npm install` and check console for specific errors

## 📱 UI Features

### **Signup Page:**
- ✅ Clean, modern design matching login page
- ✅ Form validation with real-time error messages
- ✅ Password confirmation

- ✅ Loading states
- ✅ "Back to Login" link

### **Updated Login Page:**
- ✅ Success message display from signup
- ✅ "Don't have an account? Sign up" link
- ✅ Maintained existing styling

### **Routing:**
- ✅ App starts with `/login` page
- ✅ Protected routes redirect to login if not authenticated
- ✅ Authenticated users redirect to dashboard
- ✅ Proper navigation between login/signup

## 🔐 Security Considerations

1. **Row Level Security:** Enabled on admin table
2. **Auth Policies:** Users can only access their own records
3. **Signup Policy:** Only allows creating records for authenticated user's UUID
4. **Form Validation:** Client and server-side validation
5. **Password Requirements:** Minimum 6 characters (can be increased)

## 🎨 Customization

### **Styling:**
Both login and signup pages use consistent styling with your existing design system.

### **Validation Rules:**
Update validation in `src/pages/Signup.tsx`:
```typescript
if (formData.password.length < 8) { // Change from 6 to 8
  setError('Password must be at least 8 characters long');
  return false;
}
```

### **Default Admin Settings:**
Update default admin settings in `src/utils/api.ts`:
```typescript
const adminData = {
  id: authData.user.id,
  email: email,
  name: name,
  status: 'active',
  supported_keywords: ['default', 'keywords'], // Add default keywords
  max_concurrent_jobs: 5 // Change default limit
};
```

## ✅ Verification Checklist

- [ ] Database admin table updated to use UUID
- [ ] RLS policies created
- [ ] Can access `/login` and `/signup` pages

- [ ] Signup form creates both auth user and admin record
- [ ] Login works with new accounts
- [ ] Navigation between login/signup works
- [ ] App starts with login page
- [ ] Success messages display correctly

## 🎯 Next Steps

After setup is complete, you can:
1. **Customize validation rules** as needed
2. **Add email verification** if required
3. **Implement password reset** functionality
4. **Add admin approval workflow** if needed
5. **Customize default admin permissions**

The signup feature is now fully integrated and ready to use! 🎉
