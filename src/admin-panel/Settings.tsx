import React, { useState, useEffect } from 'react'
import AdminLayout from './components/AdminLayout'
import { useAuth } from '../context/AuthContext'
import {
  updateAdminProfile,
  updateAdminPassword,
  watchAdminProfile,
  uploadAdminAvatar
} from '../services/admin/Settings'
import {
  User,
  Save,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Globe,
  CheckCircle,
  X,
  GraduationCap,
  Briefcase,
  Linkedin,
  Github
} from 'lucide-react'
import { toast } from '../components/Toast'

const AdminSettings = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    bio: '',
    skills: '',
    degree: '',
    linkedin: '',
    github: '',
    avatar: '',
    verified: false,
    preferences: {
      currency: 'PKR',
      language: 'en'
    }
  })

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const loadProfile = () => {
      setProfile({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        skills: user.skills || '',
        degree: user.degree || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        avatar: user.avatar || '',
        verified: user.verified === true,
        preferences: {
          currency: user.preferences?.currency || 'PKR',
          language: user.preferences?.language || 'en'
        }
      })
      if (user.avatar) setAvatarPreview(user.avatar)
      setLoading(false)
    }
    loadProfile()

    const unsubscribe = watchAdminProfile(user.uid, (updatedProfile) => {
      if (updatedProfile) {
        setProfile(prev => ({
          ...prev,
          name: updatedProfile.name || prev.name,
          phone: updatedProfile.phone || prev.phone,
          bio: updatedProfile.bio || prev.bio,
          skills: updatedProfile.skills || prev.skills,
          degree: updatedProfile.degree || prev.degree,
          linkedin: updatedProfile.linkedin || prev.linkedin,
          github: updatedProfile.github || prev.github,
          avatar: updatedProfile.avatar || prev.avatar,
          verified: updatedProfile.verified === true,
          preferences: {
            currency: updatedProfile.preferences?.currency || prev.preferences?.currency || 'PKR',
            language: updatedProfile.preferences?.language || prev.preferences?.language || 'en'
          }
        }))
        if (updatedProfile.avatar) setAvatarPreview(updatedProfile.avatar)
      }
    })
    return () => unsubscribe()
  }, [user])

  const handleProfileChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const autoSaveField = async (field: string, value: any) => {
    if (!user?.uid) return
    try {
      setProfile(prev => {
        const updateData = {
          name: field === 'name' ? value : prev.name,
          phone: field === 'phone' ? value : prev.phone,
          bio: field === 'bio' ? value : prev.bio,
          skills: field === 'skills' ? value : prev.skills,
          degree: field === 'degree' ? value : prev.degree,
          linkedin: field === 'linkedin' ? value : prev.linkedin,
          github: field === 'github' ? value : prev.github,
          preferences: field === 'preferences' ? value : prev.preferences,
          avatar: field === 'avatar' ? value : prev.avatar
        }
        updateAdminProfile(user!.uid, updateData).then(result => {
          if (result.success) {
            updateUser(updateData)
          }
        }).catch(err => {
          console.error('Real-time profile save error:', err)
        })
        return { ...prev, [field]: value }
      })
    } catch (err) {
      console.error('Autosave error:', err)
    }
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setProfile(prev => {
      const updatedPrefs = { ...prev.preferences, [key]: value }
      autoSaveField('preferences', updatedPrefs)
      return {
        ...prev,
        preferences: updatedPrefs
      }
    })
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setAvatarFile(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setProfile(prev => ({ ...prev, avatar: '' }))
  }

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      let avatarUrl = profile.avatar
      if (avatarFile) {
        setAvatarUploading(true)
        const uploadResult = await uploadAdminAvatar(user!.uid, avatarFile)
        if (uploadResult.success && uploadResult.url) {
          avatarUrl = uploadResult.url
        } else {
          toast.error('Failed to upload avatar: ' + uploadResult.error)
          setAvatarUploading(false)
          setSaving(false)
          return
        }
        setAvatarUploading(false)
      }
      
      const updateData = {
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
        skills: profile.skills,
        degree: profile.degree,
        linkedin: profile.linkedin,
        github: profile.github,
        preferences: profile.preferences,
        avatar: avatarUrl
      }
      const result = await updateAdminProfile(user!.uid, updateData)
      if (result.success) {
        await updateUser(updateData)
        toast.success('Profile updated successfully!')
        setAvatarFile(null)
      } else {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})
    if (!passwordForm.newPassword) {
      setPasswordErrors({ newPassword: 'New password is required' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordErrors({ newPassword: 'Password must be at least 6 characters' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match' })
      return
    }
    setPasswordLoading(true)
    try {
      const result = await updateAdminPassword(passwordForm.newPassword)
      if (result.success) {
        toast.success('Password updated successfully!')
        setPasswordForm({ newPassword: '', confirmPassword: '' })
        setShowPassword(false)
      } else {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Admin Settings</h1>
          <p className="text-gray-400">Manage your profile and account preferences</p>
        </div>

        <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-2xl p-6">
          {/* Avatar Section */}
          <div className="mb-8 pb-6 border-b border-indigo-600/20">
            <label className="block text-sm font-semibold text-gray-300 mb-4">Profile Picture</label>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-600/50 shadow-lg"
                    />
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-lime-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-indigo-600/30">
                    {profile.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-grow flex-shrink flex-col md:flex-row flex items-center gap-6">
                <div className="flex-1 space-y-3 w-full">
                  <label className="block w-full text-center px-4 py-2 bg-black/50 border border-indigo-600/30 rounded-lg cursor-pointer hover:bg-indigo-600/10 transition">
                    <Camera className="w-4 h-4 inline mr-2" /> Choose Image File
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                  </label>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Or Paste Image URL</label>
                    <input
                      type="url"
                      value={profile.avatar}
                      onChange={async (e) => {
                        const url = e.target.value
                        handleProfileChange('avatar', url)
                        setAvatarPreview(url || null)
                        await autoSaveField('avatar', url)
                      }}
                      className="w-full px-3 py-1.5 bg-black border border-indigo-600/30 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-400 text-xs font-mono"
                      placeholder="https://example.com/images/avatar.jpg"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">Max 5MB. JPG, PNG, GIF or paste direct link</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                onBlur={() => autoSaveField('name', profile.name)}
                className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                onBlur={() => autoSaveField('phone', profile.phone)}
                className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 text-sm"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                onBlur={() => autoSaveField('bio', profile.bio)}
                rows={3}
                className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 resize-none text-sm"
                placeholder="A short bio about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-lime-400" /> Academic Degree / Focus
                </label>
                <input
                  type="text"
                  value={profile.degree}
                  onChange={(e) => handleProfileChange('degree', e.target.value)}
                  onBlur={() => autoSaveField('degree', profile.degree)}
                  className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 text-sm"
                  placeholder="e.g. BS Computer Science, MBA, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-lime-400" /> Professional Skills
                </label>
                <input
                  type="text"
                  value={profile.skills}
                  onChange={(e) => handleProfileChange('skills', e.target.value)}
                  onBlur={() => autoSaveField('skills', profile.skills)}
                  className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 text-sm"
                  placeholder="e.g. React, UX Design, Leadership (comma separated)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" /> LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={profile.linkedin}
                  onChange={(e) => handleProfileChange('linkedin', e.target.value)}
                  onBlur={() => autoSaveField('linkedin', profile.linkedin)}
                  className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 text-xs"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4 text-zinc-100" /> GitHub Portfolio URL
                </label>
                <input
                  type="url"
                  value={profile.github}
                  onChange={(e) => handleProfileChange('github', e.target.value)}
                  onBlur={() => autoSaveField('github', profile.github)}
                  className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 text-xs"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="border-t border-indigo-600/20 pt-5 mt-3">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-lime-400" /> Platform Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Default Currency</label>
                  <select
                    value={profile.preferences?.currency || 'PKR'}
                    onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white"
                  >
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Language</label>
                  <select
                    value={profile.preferences?.language || 'en'}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white"
                  >
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="border-t border-indigo-600/20 pt-5 mt-3">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-lime-400" /> Change Password
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-400 text-sm mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving || avatarUploading}
                className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving || avatarUploading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings
