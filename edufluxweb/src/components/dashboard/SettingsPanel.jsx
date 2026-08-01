import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadMyAvatar,
} from '../../services/api/apiClient';

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2 select-none">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
      
      {/* Profile Section Skeleton */}
      <div className="bg-white border border-[#c7c4d8]/30 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-24 h-24 rounded-full bg-slate-200"></div>
          <div className="space-y-2 flex-grow">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Password Section Skeleton */}
      <div className="bg-white border border-[#c7c4d8]/30 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel({ showToast: propsShowToast }) {
  const toastContext = useToast();
  const showToast = propsShowToast || toastContext.showToast;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        if (isMounted) {
          setProfile(data);
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          if (data.provider === 'google' || data.isGoogleUser) {
            setIsGoogleUser(true);
          }
        }
      } catch (err) {
        showToast('Failed to load profile details', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    try {
      setAvatarUploading(true);
      const res = await uploadMyAvatar(file);
      if (res && res.avatarUrl) {
        setProfile((prev) => ({ ...prev, avatarUrl: res.avatarUrl }));
        showToast('Profile photo updated successfully');

        // Dispatch event to synchronize header and sidebar avatars
        const event = new CustomEvent('eduflux-profile-updated', {
          detail: { avatarUrl: res.avatarUrl },
        });
        window.dispatchEvent(event);
      } else {
        throw new Error('Failed to obtain new avatar URL');
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to upload photo';
      showToast(errMsg, 'error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isProfileChanged) return;

    try {
      setSavingProfile(true);
      const res = await updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      setProfile((prev) => ({
        ...prev,
        firstName: res.firstName,
        lastName: res.lastName,
        fullName: res.fullName,
      }));
      showToast('Profile changes saved successfully');

      // Dispatch event to synchronize user info in sidebar and navbar
      const event = new CustomEvent('eduflux-profile-updated', {
        detail: {
          firstName: res.firstName,
          lastName: res.lastName,
          fullName: res.fullName,
        },
      });
      window.dispatchEvent(event);
    } catch (err) {
      const errMsg = err.message || 'Failed to update profile';
      showToast(errMsg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return;
    if (newPassword !== confirmPassword) return;

    try {
      setPasswordError('');
      setSavingPassword(true);
      await changeMyPassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      showToast('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errMsg = err.message || 'Failed to update password';
      
      // If error message indicates account has no password (e.g. Google signup)
      if (
        errMsg.toLowerCase().includes('google') ||
        errMsg.toLowerCase().includes('no password') ||
        err.status === 400 && errMsg.includes('password') && (errMsg.includes('social') || errMsg.includes('set'))
      ) {
        setIsGoogleUser(true);
      } else {
        setPasswordError(errMsg);
        showToast(errMsg, 'error');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const isProfileChanged =
    firstName.trim() !== (profile?.firstName || '') ||
    lastName.trim() !== (profile?.lastName || '');

  const isNewPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const isPasswordMismatched = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const isPasswordFormValid =
    oldPassword &&
    newPassword &&
    confirmPassword &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-slide-up space-y-8 select-none">
      
      {/* Header */}
      <div>
        <h2 className="font-display text-headline-lg text-text-main font-bold">Account Settings</h2>
        <p className="font-body-md text-body-md text-text-muted mt-1">
          Manage your profile details and security settings.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white border border-[#c7c4d8]/40 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">Profile Details</h3>
        
        {/* Avatar Upload block */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="relative group w-24 h-24 rounded-full border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center bg-slate-50 cursor-pointer">
            {profile?.avatarUrl ? (
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src={profile.avatarUrl}
              />
            ) : (
              <div className="w-full h-full bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center font-bold text-2xl">
                {getInitials()}
              </div>
            )}
            
            {/* Hover overlay */}
            <div
              onClick={handleAvatarClick}
              className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[20px] mb-1">
                photo_camera
              </span>
              <span className="text-[10px] font-semibold">Change photo</span>
            </div>

            {/* Spinner overlay */}
            {avatarUploading && (
              <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
                <svg
                  className="animate-spin h-6 w-6 text-[#3525cd]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <h4 className="font-headline-xs text-headline-xs text-text-main font-bold">
              {profile?.fullName || `${firstName} ${lastName}`}
            </h4>
            <p className="font-body-sm text-body-sm text-text-muted mt-0.5">
              Email: {profile?.email}
            </p>
            <button
              onClick={handleAvatarClick}
              className="mt-3 text-xs text-[#3525cd] hover:text-[#3525cd]/80 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Upload new photo
            </button>
          </div>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">First Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  person
                </span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                  type="text"
                  placeholder="First name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">Last Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  person
                </span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                  type="text"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center select-none">
                <label className="text-xs font-semibold text-slate-600 block">Email Address</label>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs select-none">lock</span> Read-only
                </span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  mail
                </span>
                <input
                  value={profile?.email || ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-sm cursor-not-allowed outline-none select-none"
                  type="email"
                  placeholder="email@domain.com"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={!isProfileChanged || savingProfile}
              className="px-6 py-3 bg-[#3525cd] hover:bg-[#3525cd]/90 text-white font-semibold text-sm rounded-lg shadow-md shadow-[#3525cd]/15 hover:shadow-[#3525cd]/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-[#c7c4d8]/40 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">Change Password</h3>

        {isGoogleUser ? (
          <div className="bg-indigo-50 border border-indigo-200/50 rounded-xl p-5 flex items-start gap-3">
            <span className="material-symbols-outlined text-indigo-500 mt-0.5 select-none text-[22px]">
              info
            </span>
            <div>
              <h5 className="font-semibold text-slate-800 text-sm">Signed up with Google</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You registered your account using Google Authentication. There is no active password associated with your account to change.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            
            {passwordError && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-xs flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] select-none mt-0.5">error</span>
                <span className="leading-normal">{passwordError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Current Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] select-none">
                    lock
                  </span>
                  <input
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3525cd] transition-colors flex items-center cursor-pointer"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showOldPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">New Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] select-none">
                    lock
                  </span>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-3 bg-white border rounded-lg text-sm focus:ring-0 outline-none transition-all input-focus-ring ${
                      isNewPasswordTooShort ? 'border-red-500' : 'border-[#c7c4d8]/40 focus:border-[#3525cd]'
                    }`}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3525cd] transition-colors flex items-center cursor-pointer"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {isNewPasswordTooShort && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1 select-none font-medium">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Password must be at least 8 characters
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Confirm New Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] select-none">
                    lock
                  </span>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-3 bg-white border rounded-lg text-sm focus:ring-0 outline-none transition-all input-focus-ring ${
                      isPasswordMismatched ? 'border-red-500' : 'border-[#c7c4d8]/40 focus:border-[#3525cd]'
                    }`}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3525cd] transition-colors flex items-center cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {isPasswordMismatched && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1 select-none font-medium">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!isPasswordFormValid || savingPassword}
                className="px-6 py-3 bg-[#3525cd] hover:bg-[#3525cd]/90 text-white font-semibold text-sm rounded-lg shadow-md shadow-[#3525cd]/15 hover:shadow-[#3525cd]/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {savingPassword ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
