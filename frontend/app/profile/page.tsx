"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL + "/user";
const AUTH_API = process.env.NEXT_PUBLIC_API_URL + "/auth/change-password";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    gender: "",
    country: "",
    city: "",
    address: "",
    dateOfBirth: "",
    profilePicture: "", // Existing remote URL
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const getHeaders = (isMultipart = false) => {
    const token = localStorage.getItem("access_token");
    const headers: any = { Authorization: `Bearer ${token}` };
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/profile`, { headers: getHeaders() });
      if (res.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.data) {
        setProfile({
          name: data.data.name || "",
          email: data.data.email || "",
          whatsappNumber: data.data.whatsappNumber || "",
          gender: data.data.gender || "",
          country: data.data.country || "",
          city: data.data.city || "",
          address: data.data.address || "",
          dateOfBirth: data.data.dateOfBirth ? data.data.dateOfBirth.split("T")[0] : "",
          profilePicture: data.data.profilePicture || "",
        });
        localStorage.setItem("user", JSON.stringify(data.data));
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      if (profile.name) formData.append("name", profile.name);
      if (profile.whatsappNumber) formData.append("whatsappNumber", profile.whatsappNumber);
      if (profile.gender) formData.append("gender", profile.gender);
      if (profile.country) formData.append("country", profile.country);
      if (profile.city) formData.append("city", profile.city);
      if (profile.address) formData.append("address", profile.address);
      if (profile.dateOfBirth) formData.append("dateOfBirth", new Date(profile.dateOfBirth).toISOString());
      
      if (selectedImage) {
        formData.append("profilePicture", selectedImage);
      }

      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: getHeaders(true), // Content-Type omitted for FormData automatically
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("Profile updated successfully!");
        localStorage.setItem("user", JSON.stringify(data.data));
        setProfile(prev => ({ ...prev, profilePicture: data.data.profilePicture }));
        clearImageSelection(); // clear local preview, relying on the new online URL
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.oldPassword || !password.newPassword) return;

    try {
      const res = await fetch(AUTH_API, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully!");
        setPassword({ oldPassword: "", newPassword: "" });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch {
      toast.error("An error occurred changing password");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Derive which image to show
  const currentAvatar = previewUrl || profile.profilePicture;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Profile Details */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Profile Settings</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-6" encType="multipart/form-data">
            
            {/* Extended Avatar UI */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-700 dark:text-indigo-300 text-2xl font-semibold">
                      {profile.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                
                {/* Upload Overlay Button */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Upload picture"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Change picture
                </button>
                {(previewUrl) && (
                  <button type="button" onClick={clearImageSelection} className="text-xs text-red-500 ml-3 hover:underline">
                    Cancel upload
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email (Read Only)</label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={profile.email}
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">WhatsApp Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🇧🇩</span>
                  <input
                    type="text"
                    value={profile.whatsappNumber}
                    onChange={e => setProfile({ ...profile, whatsappNumber: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={e => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</label>
                <select
                  value={profile.gender}
                  onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Country</label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={e => setProfile({ ...profile, country: e.target.value })}
                  placeholder="e.g. Bangladesh"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={e => setProfile({ ...profile, city: e.target.value })}
                  placeholder="e.g. Dhaka"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Street, Area, Building..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-all shadow-sm flex justify-center items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Security</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Password</label>
              <input
                type="password"
                required
                value={password.oldPassword}
                onChange={e => setPassword({ ...password, oldPassword: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password.newPassword}
                onChange={e => setPassword({ ...password, newPassword: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-xl transition-all shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
