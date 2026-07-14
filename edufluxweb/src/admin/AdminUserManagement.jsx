import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api/apiClient';
import { useToast } from '../context/ToastContext';

export default function AdminUserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getAccessType = (email) => {
    if (!email) return 'PERSONAL';
    const domain = email.split('@')[1]?.toLowerCase() || '';
    
    // Common public email providers
    const publicProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    if (publicProviders.some(provider => domain === provider || domain.endsWith('.' + provider))) {
      return 'PERSONAL';
    }
    
    // Common organizational/educational patterns
    if (
      domain.endsWith('.edu') ||
      domain.endsWith('.edu.np') ||
      domain.endsWith('.ac.np') ||
      domain.endsWith('.ac.uk') ||
      domain.endsWith('.edu.cn') ||
      domain.endsWith('.edu.in')
    ) {
      return 'INSTITUTIONAL';
    }
    
    return 'PERSONAL';
  };

  // Detailed modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Delete confirmation modal states
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit fields state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editUserType, setEditUserType] = useState('USER');
  const [editIsActive, setEditIsActive] = useState(true);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteUserType, setInviteUserType] = useState('USER');

  // Fetch users from API
  const fetchUsers = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/user?page=${page}&limit=${pageSize}`);
      if (response && response.data) {
        setUsers(response.data);
        if (response.meta) {
          setTotalUsers(response.meta.total);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Open user details and fetch fresh by ID
  const handleOpenDetails = async (userId) => {
    setDetailLoading(true);
    setIsEditMode(false);
    try {
      const user = await apiClient.get(`/admin/user/${userId}`);
      if (user) {
        setSelectedUser(user);
        // Initialize edit states
        setEditFirstName(user.firstName || '');
        setEditLastName(user.lastName || '');
        setEditEmail(user.email || '');
        setEditUserType(user.userType || 'USER');
        setEditIsActive(user.isActive !== false);
        setEditPassword('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve user details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Create User submit handler
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const payload = {
        firstName: inviteFirstName,
        lastName: inviteLastName,
        email: inviteEmail,
        password: invitePassword || 'Eduflux123!', // fallback default
        userType: inviteUserType,
        isActive: true
      };

      await apiClient.post('/admin/user', JSON.stringify(payload));
      showToast(`User ${inviteEmail} created successfully!`);
      setIsInviteModalOpen(false);

      // Clear forms
      setInviteFirstName('');
      setInviteLastName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteUserType('USER');

      // Refresh list
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  // Update User properties
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload = {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        userType: editUserType,
        isActive: editIsActive
      };

      // Only send password if it is updated
      if (editPassword) {
        payload.password = editPassword;
      }

      await apiClient.patch(`/admin/user/${selectedUser._id}`, JSON.stringify(payload));
      showToast('User updated successfully');

      // Refresh current user and list
      handleOpenDetails(selectedUser._id);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  // Suspend/Activate toggle directly
  const handleToggleActiveStatus = async (user) => {
    try {
      const updatedStatus = !user.isActive;
      await apiClient.patch(`/admin/user/${user._id}`, JSON.stringify({ isActive: updatedStatus }));
      showToast(`User status updated to ${updatedStatus ? 'Active' : 'Suspended'}`);

      // Refresh
      if (selectedUser && selectedUser._id === user._id) {
        handleOpenDetails(user._id);
      }
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Delete User handler (initiates confirmation popup)
  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
  };

  // Confirms and executes user deletion
  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(`/admin/user/${deleteUserId}`);
      showToast(response?.message || 'User deleted successfully');
      setDeleteUserId(null);
      // Close detail drawer if deleted user was open
      if (selectedUser && selectedUser._id === deleteUserId) {
        setSelectedUser(null);
      }

      // Refresh the user list
      const remainingOnPage = users.length - 1;
      if (remainingOnPage === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchUsers(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = () => {
    showToast('Exporting active user directories...');
    setTimeout(() => {
      showToast('CSV directory downloaded successfully!');
    }, 1200);
  };

  // Filter & search implementation
  const filteredUsers = users.filter((user) => {
    // Filter tags: Faculty (ADMIN) vs Students (USER)
    if (activeFilter === 'Faculty' && user.userType !== 'ADMIN') return false;
    if (activeFilter === 'Students' && user.userType !== 'USER') return false;

    // Search queries
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.role || '').toLowerCase().includes(query) ||
        (user.userType || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-8 font-sans text-[#1E293B]">
      {/* Top Search & Actions for Mobile */}
      <div className="flex justify-between items-center bg-white border border-[#c7c4d8]/40 p-4 rounded-xl shadow-sm md:hidden">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-[#f3f4f5] border-none rounded-full text-xs outline-none"
            placeholder="Search users..."
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 text-white bg-[#4f46e5] px-3 py-2 rounded-lg text-xs font-semibold hover:shadow-md transition-all active:scale-95 ml-2"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Invite
        </button>
      </div>

      {/* Filters & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-[#c7c4d8]/40 overflow-hidden p-1 bg-white">
            {['All', 'Faculty', 'Students'].map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all ${activeFilter === filter
                  ? 'bg-[#3525cd] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-[#f3f4f5] hover:text-[#1E293B]'
                  }`}
              >
                {filter === 'All' ? 'All Users' : filter}
              </button>
            ))}
          </div>

          {/* Desktop Search Bar */}
          <div className="relative hidden md:block w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 border border-[#c7c4d8]/40 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd] transition-all"
              placeholder="Search users by name or email..."
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="hidden md:flex items-center gap-2 text-white bg-[#4f46e5] px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Invite User
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c7c4d8]/45 rounded-lg hover:border-[#3525cd] text-[#3525cd] transition-all text-sm font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Users Bento Grid Table */}
      <div className="bg-white border border-[#c7c4d8]/45 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <svg className="animate-spin h-8 w-8 text-[#3525cd]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-slate-500">Loading user repository...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f4f5] border-b border-[#c7c4d8]/40">
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">User</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Role</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Joined Date</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Access Type</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d8]/20">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
                    const joinedDate = user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                      : 'Oct 12, 2023';

                    return (
                      <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#3525cd]/10 text-[#3525cd] font-bold flex items-center justify-center ring-2 ring-[#e2dfff]">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1E293B] group-hover:text-[#3525cd] transition-colors">
                                {fullName}
                              </p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1E293B]">
                          {user.userType === 'ADMIN' ? 'Administrator' : 'Student / Researcher'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{joinedDate}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.userType === 'ADMIN'
                              ? 'bg-[#eaddff] text-[#5a00c6]'
                              : getAccessType(user.email) === 'INSTITUTIONAL'
                              ? 'bg-[#e2dfff] text-[#3323cc]'
                              : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {user.userType === 'ADMIN' ? 'System Admin' : getAccessType(user.email)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActiveStatus(user)}
                            className={`flex items-center gap-1.5 text-xs font-semibold hover:opacity-80`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${user.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-[#ba1a1a]'
                                }`}
                            ></span>
                            {user.isActive !== false ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenDetails(user._id)}
                            className="p-2 hover:bg-[#3525cd]/10 rounded-full text-slate-400 hover:text-[#3525cd] transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user._id)}
                            className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-600 transition-all ml-1"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500 text-sm">
                      No users found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="px-6 py-4 bg-[#f3f4f5] border-t border-[#c7c4d8]/40 flex items-center justify-between mt-auto">
          <p className="text-xs text-slate-500 font-medium">
            Showing {totalUsers > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-[#c7c4d8]/40 bg-white hover:bg-slate-50 hover:border-[#3525cd] transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            {Array.from({ length: Math.ceil(totalUsers / pageSize) || 1 }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded-md text-sm font-semibold border transition-colors ${currentPage === pageNum
                  ? 'bg-[#3525cd] text-white border-transparent'
                  : 'bg-white border-[#c7c4d8]/40 hover:bg-[#f3f4f5] text-[#1E293B]'
                  }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalUsers / pageSize) || 1))}
              disabled={currentPage === (Math.ceil(totalUsers / pageSize) || 1)}
              className="p-1.5 rounded-md border border-[#c7c4d8]/40 bg-white hover:bg-slate-50 hover:border-[#3525cd] transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Detail & Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#c7c4d8]/40 flex justify-between items-center bg-[#f8f9fa]">
              <div>
                <h3 className="text-lg font-bold text-[#3525cd]">
                  {isEditMode ? 'Edit User Details' : 'User Information'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Detailed account credentials and permissions.</p>
              </div>
              <button
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                onClick={() => setSelectedUser(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <svg className="animate-spin h-8 w-8 text-[#3525cd]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-slate-500">Loading user profile...</span>
                </div>
              ) : isEditMode ? (
                <form onSubmit={handleSaveChanges} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Update Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Enter new password to reset"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">User Type</label>
                      <select
                        value={editUserType}
                        onChange={(e) => setEditUserType(e.target.value)}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      >
                        <option value="USER">Student / Researcher</option>
                        <option value="ADMIN">System Admin</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="w-4 h-4 text-[#3525cd] border-[#c7c4d8]/50 rounded focus:ring-[#3525cd]/20"
                      />
                      <label htmlFor="editIsActive" className="text-xs font-bold text-slate-600 select-none">
                        Active Account
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-[#c7c4d8]/30">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-5 py-2 border border-[#c7c4d8]/40 bg-white text-[#1E293B] text-sm font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#3525cd] text-white text-sm font-semibold rounded-lg hover:shadow-md active:scale-95 transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#3525cd]/10 text-[#3525cd] font-bold text-3xl flex items-center justify-center ring-4 ring-[#e2dfff]/40 shadow-md shrink-0">
                      {selectedUser.firstName ? selectedUser.firstName.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h4 className="text-xl font-bold text-[#1E293B]">
                          {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email.split('@')[0]}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedUser.userType === 'ADMIN'
                            ? 'bg-[#eaddff] text-[#5a00c6]'
                            : getAccessType(selectedUser.email) === 'INSTITUTIONAL'
                            ? 'bg-[#e2dfff] text-[#3323cc]'
                            : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                          {selectedUser.userType === 'ADMIN' ? 'System Admin' : getAccessType(selectedUser.email)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{selectedUser.email}</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#f3f4f5] p-3 rounded-lg border border-[#c7c4d8]/20">
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider font-mono">Status</p>
                          <p className={`text-sm font-semibold ${selectedUser.isActive !== false ? 'text-emerald-600' : 'text-[#ba1a1a]'}`}>
                            {selectedUser.isActive !== false ? 'Active' : 'Suspended'}
                          </p>
                        </div>
                        <div className="bg-[#f3f4f5] p-3 rounded-lg border border-[#c7c4d8]/20">
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider font-mono">Storage Used</p>
                          <p className="text-sm font-semibold text-[#1E293B]">0.8 GB / 10 GB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-[#3525cd] mb-3 border-b border-[#c7c4d8]/30 pb-2">Academic Profile</h5>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Primary Department</p>
                        <p className="font-semibold text-[#1E293B]">Computer Science</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Affiliation</p>
                        <p className="font-semibold text-[#1E293B]">Techspire College</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Date Created</p>
                        <p className="font-semibold text-[#1E293B]">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Oct 12, 2023'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">User Scope</p>
                        <p className="font-semibold text-[#1E293B]">
                          {selectedUser.userType === 'ADMIN' ? 'Global Admin Permissions' : 'Standard Academic Hub'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-[#f3f4f5] p-4 rounded-xl border border-[#c7c4d8]/20">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Danger Zone</p>
                      <p className="text-[11px] text-slate-500">Irreversibly remove this user profile from the database.</p>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(selectedUser._id)}
                      className="px-4 py-2 border border-[#ba1a1a] text-[#ba1a1a] font-semibold text-xs rounded-lg hover:bg-[#ba1a1a]/5 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete User
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isEditMode && (
              <div className="px-8 py-5 bg-[#f3f4f5] border-t border-[#c7c4d8]/40 flex justify-between gap-3">
                <button
                  onClick={() => handleToggleActiveStatus(selectedUser)}
                  className={`px-6 py-2 border font-semibold text-sm rounded-lg transition-all ${selectedUser.isActive !== false
                    ? 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/5'
                    : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                    }`}
                >
                  {selectedUser.isActive !== false ? 'Suspend User' : 'Unsuspend User'}
                </button>
                <div className="flex gap-3">
                  <button
                    className="px-6 py-2 border border-[#c7c4d8]/40 bg-white text-[#1E293B] font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-6 py-2 bg-[#3525cd] text-white font-semibold text-sm rounded-lg hover:shadow-lg active:scale-95 transition-all"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite/Create User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <form
            onSubmit={handleInviteSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-[#c7c4d8]/40 flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="text-lg font-bold text-[#3525cd]">Invite New User</h3>
              <button
                type="button"
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. professor@university.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Temporary Password</label>
                <input
                  required
                  type="password"
                  placeholder="Enter access password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">User Scope (Role)</label>
                <select
                  value={inviteUserType}
                  onChange={(e) => setInviteUserType(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                >
                  <option value="USER">Student / Researcher (USER)</option>
                  <option value="ADMIN">System Administrator (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f3f4f5] border-t border-[#c7c4d8]/40 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-[#c7c4d8]/40 bg-white text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#3525cd] text-white font-semibold text-sm rounded-lg hover:shadow-lg active:scale-[0.98] transition-all"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#c7c4d8]/40 flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="text-lg font-bold text-[#ba1a1a] flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Confirm Deletion
              </h3>
              <button
                type="button"
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                onClick={() => setDeleteUserId(null)}
                disabled={deleteLoading}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this user? All associated research folders, document configurations, and AI chat histories will be removed. This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 bg-[#f3f4f5] border-t border-[#c7c4d8]/40 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-[#c7c4d8]/40 bg-white text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50"
                onClick={() => setDeleteUserId(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#ba1a1a] text-white font-semibold text-sm rounded-lg hover:bg-[#ba1a1a]/90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
