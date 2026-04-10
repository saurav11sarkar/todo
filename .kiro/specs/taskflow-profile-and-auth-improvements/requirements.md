# Requirements Document

## Introduction

This feature makes the TaskFlow full-stack application (NestJS backend + Next.js 14 frontend) production-ready by:

1. Completing the forgot-password / OTP-verify / reset-password flow in the frontend (all backend endpoints already exist).
2. Fixing the profile update API call to use `multipart/form-data` so profile picture uploads work end-to-end with Cloudinary.
3. Adding a profile image upload UI with live avatar preview.
4. Enriching the profile page with all available user fields (gender, country, city, address, dateOfBirth).
5. Wiring every missing frontend page to its corresponding backend API.
6. Applying consistent, modern, production-quality UI across all pages using the existing zinc/indigo/violet design system.

The backend APIs are already complete and working. All work is frontend-focused, with minor backend verification where needed.

---

## Glossary

- **App**: The TaskFlow Next.js 14 frontend application.
- **API**: The NestJS backend REST API served at `NEXT_PUBLIC_API_URL`.
- **Auth_Flow**: The sequence of pages: Login → Forgot Password → Verify OTP → Reset Password.
- **Profile_Page**: The `/profile` route where authenticated users manage their account.
- **Profile_Form**: The multipart/form-data form on the Profile_Page that updates user fields and optionally uploads a profile picture.
- **Avatar**: The circular image or initials fallback shown in the header and on the Profile_Page.
- **OTP**: A 6-digit one-time password sent to the user's email by `POST /auth/forgot-password`.
- **Access_Token**: The JWT stored in `localStorage` under the key `access_token`, sent as `Authorization: Bearer <token>` on authenticated requests.
- **Cloudinary**: The cloud image service used by the backend to store profile pictures; returns a public URL stored in `user.profilePicture`.
- **Twilio**: The messaging service used by the backend scheduler to send WhatsApp/SMS deadline reminders.
- **Toast**: A `react-hot-toast` notification shown to the user after an action succeeds or fails.

---

## Requirements

### Requirement 1: Forgot Password Page

**User Story:** As a user who has forgotten their password, I want a dedicated page to request a password-reset OTP, so that I can start the recovery process without leaving the app.

#### Acceptance Criteria

1. THE App SHALL provide a `/forgot-password` page accessible without authentication.
2. WHEN the user submits a valid email on the `/forgot-password` page, THE App SHALL call `POST /auth/forgot-password` with `{ email }` and display a success Toast confirming the OTP was sent.
3. IF `POST /auth/forgot-password` returns a non-2xx response, THEN THE App SHALL display the error message from the response body in a Toast.
4. WHEN the OTP request succeeds, THE App SHALL automatically navigate the user to `/verify-otp?email=<encoded_email>` so the email is pre-filled on the next step.
5. THE `/forgot-password` page SHALL include a "Back to login" link that navigates to `/login`.
6. WHILE the forgot-password request is in-flight, THE App SHALL disable the submit button and show a loading spinner inside it.

---

### Requirement 2: Verify OTP Page

**User Story:** As a user who requested a password reset, I want to enter the 6-digit OTP I received by email, so that I can prove ownership of the account before setting a new password.

#### Acceptance Criteria

1. THE App SHALL provide a `/verify-otp` page accessible without authentication.
2. WHEN the `/verify-otp` page loads, THE App SHALL read the `email` query parameter and pre-populate the email field (read-only).
3. THE App SHALL render six individual single-digit input boxes that auto-advance focus to the next box when a digit is entered, and auto-retreat focus to the previous box on Backspace.
4. WHEN all six digits are entered and the user submits, THE App SHALL call `POST /auth/verify` with `{ email, otp: "<6-digit string>" }` where `otp` is the concatenated string of the six digit inputs.
5. WHEN `POST /auth/verify` returns a 2xx response, THE App SHALL navigate to `/reset-password?email=<encoded_email>`.
6. IF `POST /auth/verify` returns a non-2xx response, THEN THE App SHALL display the error message in a Toast and clear the OTP input boxes.
7. WHILE the verify request is in-flight, THE App SHALL disable the submit button and show a loading spinner.

---

### Requirement 3: Reset Password Page

**User Story:** As a user who has verified their OTP, I want to set a new password, so that I can regain access to my account.

#### Acceptance Criteria

1. THE App SHALL provide a `/reset-password` page accessible without authentication.
2. WHEN the `/reset-password` page loads, THE App SHALL read the `email` query parameter and include it (hidden) in the submission payload.
3. THE `/reset-password` page SHALL include a "New password" field and a "Confirm password" field, both with show/hide toggles.
4. IF the new password and confirm password values do not match, THEN THE App SHALL display an inline validation error and prevent form submission.
5. IF the new password is fewer than 6 characters, THEN THE App SHALL display an inline validation error and prevent form submission.
6. WHEN the user submits valid matching passwords, THE App SHALL call `POST /auth/reset-password` with `{ email, newPassword }`.
7. WHEN `POST /auth/reset-password` returns a 2xx response, THE App SHALL display a success Toast and navigate to `/login`.
8. IF `POST /auth/reset-password` returns a non-2xx response, THEN THE App SHALL display the error message in a Toast.
9. WHILE the reset request is in-flight, THE App SHALL disable the submit button and show a loading spinner.

---

### Requirement 4: Login Page — Forgot Password Link

**User Story:** As a user on the login page, I want a "Forgot password?" link, so that I can quickly navigate to the password recovery flow.

#### Acceptance Criteria

1. THE App SHALL display a "Forgot password?" link on the `/login` page, positioned below the password field.
2. WHEN the user clicks "Forgot password?", THE App SHALL navigate to `/forgot-password`.
3. THE "Forgot password?" link SHALL be visually distinct from body text (indigo color, matching the existing design system).

---

### Requirement 5: Profile Page — Multipart Form Data Upload

**User Story:** As an authenticated user, I want my profile update request to be sent as `multipart/form-data`, so that I can upload a profile picture alongside my other profile fields.

#### Acceptance Criteria

1. WHEN the user submits the Profile_Form, THE App SHALL send a `PUT /user/profile` request using `multipart/form-data` (via the browser `FormData` API) instead of `application/json`.
2. THE Profile_Form SHALL append all non-empty text fields (`name`, `whatsappNumber`, `gender`, `country`, `city`, `address`, `dateOfBirth`) to the `FormData` object before submission.
3. IF the user has selected a new profile picture file, THEN THE App SHALL append the file to the `FormData` object under the field name `profilePicture`.
4. THE App SHALL NOT set a `Content-Type` header manually on the profile update request, allowing the browser to set the correct `multipart/form-data` boundary automatically.
5. WHEN `PUT /user/profile` returns a 2xx response, THE App SHALL update the `user` object in `localStorage` with the returned `data` object and display a success Toast.
6. IF `PUT /user/profile` returns a non-2xx response, THEN THE App SHALL display the error message from the response body in a Toast.

---

### Requirement 6: Profile Page — Profile Picture Upload UI

**User Story:** As an authenticated user, I want to see my current profile picture and be able to upload a new one, so that my account feels personal and recognizable.

#### Acceptance Criteria

1. THE Profile_Page SHALL display a circular Avatar at the top of the profile section.
2. WHILE `user.profilePicture` is a non-empty URL, THE Avatar SHALL render an `<img>` element with that URL as the `src`.
3. IF `user.profilePicture` is absent or empty, THEN THE Avatar SHALL render the user's first initial in a styled fallback circle using the indigo color palette.
4. THE Profile_Page SHALL include a clickable camera-icon overlay on the Avatar that opens a hidden `<input type="file" accept="image/*">` when clicked.
5. WHEN the user selects an image file, THE App SHALL display a local object URL preview of the selected file in the Avatar immediately (before upload).
6. THE App SHALL accept only image files (MIME type `image/*`) in the file input.
7. WHEN the Profile_Form is submitted with a newly selected file, THE App SHALL include that file in the `FormData` as specified in Requirement 5.
8. WHEN the profile update succeeds and the response contains a new `profilePicture` URL, THE App SHALL update the Avatar `src` to the new Cloudinary URL and revoke the temporary object URL.

---

### Requirement 7: Profile Page — Extended User Fields

**User Story:** As an authenticated user, I want to view and edit all my profile fields (gender, country, city, address, date of birth), so that my profile is complete and up to date.

#### Acceptance Criteria

1. THE Profile_Page SHALL display and allow editing of the following fields: `name`, `whatsappNumber`, `gender`, `country`, `city`, `address`, `dateOfBirth`.
2. THE `email` field SHALL be displayed as read-only and non-editable.
3. THE `gender` field SHALL be rendered as a `<select>` element with options: Male, Female, Other.
4. THE `dateOfBirth` field SHALL be rendered as an `<input type="date">` element.
5. WHEN the Profile_Page loads, THE App SHALL call `GET /user/profile` and populate all fields with the returned data.
6. WHEN the user saves the profile, THE App SHALL include only the fields that have non-empty values in the `FormData` payload.

---

### Requirement 8: Header Avatar — Profile Picture Display

**User Story:** As an authenticated user, I want to see my profile picture (or initials) in the app header, so that I have a visual confirmation of who is logged in.

#### Acceptance Criteria

1. THE App header (in the TodoList component) SHALL display the Avatar using the same logic as the Profile_Page Avatar: render an `<img>` with `user.profilePicture` if available, otherwise render the first-initial fallback circle.
2. WHEN the user updates their profile picture and the response is stored in `localStorage`, THE App SHALL reflect the updated Avatar in the header on the next page load or navigation.
3. THE Avatar in the header SHALL be a clickable link that navigates to `/profile`.
4. THE App SHALL read the `user` object from `localStorage` on mount to populate the header Avatar, so that the profile picture persists across page refreshes.

---

### Requirement 9: Consistent Design System

**User Story:** As a user, I want all pages to look and feel consistent, so that the app feels polished and production-ready.

#### Acceptance Criteria

1. THE App SHALL use the zinc/indigo/violet color palette consistently across all pages (login, register, forgot-password, verify-otp, reset-password, profile, dashboard).
2. THE App SHALL use `rounded-2xl` cards, `rounded-xl` inputs, and `rounded-xl` buttons as the standard border-radius tokens.
3. THE App SHALL support dark mode on all pages using Tailwind's `dark:` variant classes.
4. THE App SHALL display a full-page centered spinner while any page-level data fetch is in-flight.
5. THE App SHALL show a Toast notification (via `react-hot-toast`) for every user-initiated action that succeeds or fails.
6. WHILE a form submission is in-flight, THE App SHALL disable the submit button and replace its label with a spinner to prevent duplicate submissions.

---

### Requirement 10: Authentication Guard Consistency

**User Story:** As a developer, I want all protected pages to redirect unauthenticated users to `/login`, so that the app is secure and consistent.

#### Acceptance Criteria

1. WHEN an unauthenticated request (missing or expired Access_Token) receives a 401 response from the API, THE App SHALL clear `localStorage` and redirect the user to `/login`.
2. THE `/`, `/profile` routes SHALL check for the presence of `access_token` in `localStorage` on mount and redirect to `/login` if absent.
3. THE `/forgot-password`, `/verify-otp`, `/reset-password`, `/login`, `/register` routes SHALL be accessible without an Access_Token.
