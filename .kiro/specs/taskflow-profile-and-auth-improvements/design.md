# Design Document

## Overview

All work is frontend-only (Next.js 14 App Router + TypeScript + Tailwind CSS). The NestJS backend APIs are complete and working. This document describes the component structure, data flow, API contracts, and implementation decisions for each requirement.

---

## Architecture

### File Structure (new/modified files)

```
frontend/app/
├── forgot-password/
│   └── page.tsx          # NEW — Requirement 1
├── verify-otp/
│   └── page.tsx          # NEW — Requirement 2
├── reset-password/
│   └── page.tsx          # NEW — Requirement 3
├── login/
│   └── page.tsx          # MODIFY — add Forgot Password link (Req 4), fix access_token key
├── profile/
│   └── page.tsx          # MODIFY — multipart upload, avatar, extended fields (Req 5-7)
└── components/
    └── TodoList.tsx       # MODIFY — header avatar with profile picture (Req 8)
```

No new dependencies are required. All pages use existing packages: `react-hot-toast`, `next/navigation`, `next/link`.

---

## Known Bug: Login Token Key Mismatch

The backend `AuthService.login()` returns `{ accessToken, user }` (camelCase). The frontend `login/page.tsx` reads `data.data.access_token` (snake_case). This causes the token to be stored as `undefined`.

**Fix:** Change `data.data.access_token` → `data.data.accessToken` in `login/page.tsx`.

---

## Requirement 1 — Forgot Password Page (`/forgot-password`)

### Component: `app/forgot-password/page.tsx`

**State:**

```ts
email: string;
loading: boolean;
```

**Flow:**

1. User enters email and submits.
2. `POST /auth/forgot-password` with `{ email }`.
3. On success → `toast.success(...)` → `router.push('/verify-otp?email=' + encodeURIComponent(email))`.
4. On error → `toast.error(data.message)`.

**Layout:** Matches the existing split-panel design (left branding panel, right form panel) used by login/register pages.

---

## Requirement 2 — Verify OTP Page (`/verify-otp`)

### Component: `app/verify-otp/page.tsx`

**State:**

```ts
digits: string[6]; // one entry per input box
email: string; // read from searchParams
loading: boolean;
```

**OTP Input UX:**

- Six `<input maxLength={1} inputMode="numeric" pattern="[0-9]">` elements rendered in a row.
- `onChange`: accept only digits; on valid digit, move focus to `refs[index + 1]`.
- `onKeyDown`: on `Backspace` with empty value, move focus to `refs[index - 1]`.
- `onPaste`: distribute pasted digits across all six boxes.
- Refs managed via `useRef<HTMLInputElement[]>([])`.

**Flow:**

1. On mount, read `email` from `useSearchParams()`.
2. On submit, concatenate `digits.join('')` → call `POST /auth/verify` with `{ email, otp }`.
3. On success → `router.push('/reset-password?email=' + encodeURIComponent(email))`.
4. On error → `toast.error(data.message)` + clear all digit inputs + focus first box.

---

## Requirement 3 — Reset Password Page (`/reset-password`)

### Component: `app/reset-password/page.tsx`

**State:**

```ts
newPassword: string;
confirmPassword: string;
showNew: boolean;
showConfirm: boolean;
loading: boolean;
inlineError: string;
```

**Validation (client-side, before API call):**

- `newPassword.length < 6` → set `inlineError`, block submit.
- `newPassword !== confirmPassword` → set `inlineError`, block submit.

**Flow:**

1. On mount, read `email` from `useSearchParams()`.
2. On valid submit → `POST /auth/reset-password` with `{ email, newPassword }`.
3. On success → `toast.success('Password reset!')` → `router.push('/login')`.
4. On error → `toast.error(data.message)`.

---

## Requirement 4 — Login Page: Forgot Password Link

**Modification to `app/login/page.tsx`:**

1. Add a `<Link href="/forgot-password">` below the password field, right-aligned, styled `text-indigo-600 text-sm`.
2. Fix the token storage key: `data.data.access_token` → `data.data.accessToken`.

---

## Requirement 5 — Profile Page: Multipart Form Data

**Modification to `app/profile/page.tsx` — `handleProfileUpdate`:**

Replace the `application/json` fetch with a `FormData` approach:

```ts
const fd = new FormData();
if (profile.name) fd.append("name", profile.name);
if (profile.whatsappNumber) fd.append("whatsappNumber", profile.whatsappNumber);
if (profile.gender) fd.append("gender", profile.gender);
if (profile.country) fd.append("country", profile.country);
if (profile.city) fd.append("city", profile.city);
if (profile.address) fd.append("address", profile.address);
if (profile.dateOfBirth) fd.append("dateOfBirth", profile.dateOfBirth);
if (selectedFile) fd.append("profilePicture", selectedFile);

const res = await fetch(`${API}/profile`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` }, // NO Content-Type
  body: fd,
});
```

The `Authorization` header is set manually; `Content-Type` is intentionally omitted so the browser sets the correct `multipart/form-data; boundary=...` value.

---

## Requirement 6 — Profile Page: Avatar Upload UI

**New state in `app/profile/page.tsx`:**

```ts
selectedFile: File | null;
previewUrl: string | null; // object URL for local preview
```

**Avatar component (inline JSX):**

```tsx
<div className="relative w-20 h-20">
  {previewUrl || profile.profilePicture ? (
    <img
      src={previewUrl ?? profile.profilePicture}
      className="w-20 h-20 rounded-full object-cover"
    />
  ) : (
    <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
        {profile.name?.charAt(0).toUpperCase()}
      </span>
    </div>
  )}
  <button
    onClick={() => fileInputRef.current?.click()}
    className="absolute bottom-0 right-0 ...camera icon..."
  ></button>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileSelect}
  />
</div>
```

**`handleFileSelect`:**

```ts
const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  setSelectedFile(file);
  setPreviewUrl(URL.createObjectURL(file));
};
```

**After successful upload:** revoke the object URL and update `profile.profilePicture` from the response.

---

## Requirement 7 — Profile Page: Extended Fields

**Extended profile state:**

```ts
const [profile, setProfile] = useState({
  name: "",
  email: "",
  whatsappNumber: "",
  gender: "",
  country: "",
  city: "",
  address: "",
  dateOfBirth: "",
  profilePicture: "",
});
```

**`fetchProfile` mapping:**

```ts
setProfile({
  name: data.data.name ?? "",
  email: data.data.email ?? "",
  whatsappNumber: data.data.whatsappNumber ?? "",
  gender: data.data.gender ?? "",
  country: data.data.country ?? "",
  city: data.data.city ?? "",
  address: data.data.address ?? "",
  dateOfBirth: data.data.dateOfBirth
    ? new Date(data.data.dateOfBirth).toISOString().split("T")[0]
    : "",
  profilePicture: data.data.profilePicture ?? "",
});
```

**Gender field:** `<select>` with options `['', 'Male', 'Female', 'Other']` (empty = not set).

**Date of birth field:** `<input type="date">` — value is `YYYY-MM-DD` string.

---

## Requirement 8 — Header Avatar

**Modification to `app/components/TodoList.tsx`:**

Extend the `User` interface:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  profilePicture?: string;
}
```

Replace the initials-only avatar in the header with:

```tsx
<Link href="/profile" className="...">
  {user.profilePicture ? (
    <img
      src={user.profilePicture}
      className="w-7 h-7 rounded-full object-cover"
      alt={user.name}
    />
  ) : (
    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
      <span className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
        {user.name?.charAt(0).toUpperCase()}
      </span>
    </div>
  )}
  <span className="text-sm text-zinc-600 dark:text-zinc-400">{user.name}</span>
</Link>
```

The `user` object is read from `localStorage` on mount, so the profile picture persists across refreshes.

---

## Requirement 9 — Design System Consistency

All new pages (`/forgot-password`, `/verify-otp`, `/reset-password`) follow the same layout pattern as the existing login/register pages:

- Left panel: `bg-zinc-950` with radial gradient overlays, branding, and feature callouts.
- Right panel: `bg-zinc-50 dark:bg-zinc-900` with centered form card.
- Inputs: `rounded-xl`, `focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500`.
- Buttons: `rounded-xl`, `bg-indigo-600 hover:bg-indigo-700`.
- Cards: `rounded-2xl`, `border border-zinc-200 dark:border-zinc-800`.
- Toasts: `react-hot-toast` (already configured in `layout.tsx`).
- Loading state: spinner inside submit button + `disabled` attribute.

---

## Requirement 10 — Auth Guard Consistency

**Pattern used across all protected pages (`/`, `/profile`):**

```ts
useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    router.push("/login");
    return;
  }
  // fetch data...
}, []);
```

**401 handling in any fetch call:**

```ts
if (res.status === 401) {
  localStorage.clear();
  router.push("/login");
  return;
}
```

Public pages (`/forgot-password`, `/verify-otp`, `/reset-password`, `/login`, `/register`) require no token check.

---

## API Reference Summary

| Method | Endpoint                | Auth   | Body / Notes                                              |
| ------ | ----------------------- | ------ | --------------------------------------------------------- |
| POST   | `/auth/forgot-password` | None   | `{ email }`                                               |
| POST   | `/auth/verify`          | None   | `{ email, otp: string }`                                  |
| POST   | `/auth/reset-password`  | None   | `{ email, newPassword }`                                  |
| POST   | `/auth/login`           | None   | `{ email, password }` → returns `{ accessToken, user }`   |
| GET    | `/user/profile`         | Bearer | Returns full user object                                  |
| PUT    | `/user/profile`         | Bearer | `multipart/form-data` with optional `profilePicture` file |
