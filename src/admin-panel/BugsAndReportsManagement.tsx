import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToAllBugReports, 
  updateBugReportStatus, 
  deleteBugReport, 
  BugReport 
} from '../services/user/BugsAndReports';
import { 
  Bug, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Trash2, 
  Filter, 
  Search, 
  MessageSquare, 
  Save, 
  X,
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { toast } from '../components/Toast';

const BugsAndReportsManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // States
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | BugReport['status']>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | BugReport['severity']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BugReport['category']>('all');
  
  // Status edit values
  const [editStatus, setEditStatus] = useState<BugReport['status']>('pending');
  const [editAdminNotes, setEditAdminNotes] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllBugReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update edit fields when selected report changes
  useEffect(() => {
    if (selectedReport) {
      setEditStatus(selectedReport.status);
      setEditAdminNotes(selectedReport.adminNotes || '');
    }
  }, [selectedReport]);

  const handleUpdateStatusAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setIsUpdating(true);
    try {
      const res = await updateBugReportStatus(
        selectedReport.id, 
        editStatus, 
        editAdminNotes.trim()
      );
      if (res.success) {
        toast.success('Ticket updated successfully!');
        // Keep selected report updated
        setSelectedReport((prev) => prev ? { 
          ...prev, 
          status: editStatus, 
          adminNotes: editAdminNotes.trim(),
          updatedAt: new Date().toISOString()
        } : null);
      } else {
        toast.error(res.error || 'Failed to update ticket.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;
    setIsDeleting(true);
    try {
      const res = await deleteBugReport(selectedReport.id);
      if (res.success) {
        toast.success('Ticket deleted permanently.');
        setSelectedReport(null);
        setShowDeleteConfirm(false);
      } else {
        toast.error(res.error || 'Failed to delete report.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Chip helper
  const getStatusBadge = (status: BugReport['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <MessageSquare className="w-3 h-3 animate-pulse" />
            <span>Investigating</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
            <CheckCircle className="w-3 h-3" />
            <span>Closed</span>
          </span>
        );
    }
  };

  // Severity Helper
  const getSeverityBadge = (sev: BugReport['severity']) => {
    switch (sev) {
      case 'low':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-650 dark:text-slate-400 font-medium border border-slate-500/10">Low</span>;
      case 'medium':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-medium border border-indigo-500/10">Medium</span>;
      case 'high':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-650 dark:text-orange-400 font-medium border border-orange-500/10">High</span>;
      case 'critical':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20 animate-pulse">Critical</span>;
    }
  };

  // Category label helper
  const getCategoryLabel = (cat: BugReport['category']) => {
    switch (cat) {
      case 'ui': return 'UI / Polish';
      case 'functional': return 'Functional';
      case 'performance': return 'Performance';
      case 'content': return 'Incorrect Content';
      case 'other': return 'Other Question';
    }
  };

  // Application logic filter
  const filteredReports = reports.filter((report) => {
    // Search filter
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;

    // Severity filter
    const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
          
          {/* Header section with Stats counts */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-indigo-600/10 pb-5">
            <div>
              <div className="flex items-center space-x-2 text-indigo-650 dark:text-lime-400 mb-1">
                <Bug className="w-5 h-5" />
                <span className="text-xs uppercase font-extrabold tracking-widest font-mono">Operations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Bug & Polish Resolution center
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Manage reports, assign status, and provide resolutions directly to student dashboards.
              </p>
            </div>

            {/* Micro Stats summary */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="bg-white dark:bg-black/50 px-3 py-2 border border-gray-200 dark:border-indigo-600/10 rounded-xl max-w-xs flex flex-col justify-center shadow-sm">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Pending</span>
                <span className="text-base font-bold text-amber-500">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              </div>
              <div className="bg-white dark:bg-black/50 px-3 py-2 border border-gray-200 dark:border-indigo-600/10 rounded-xl max-w-xs flex flex-col justify-center shadow-sm">
                <span className="text-gray-400 text-[10px] font-bold uppercase">In-Progress</span>
                <span className="text-base font-bold text-blue-500">
                  {reports.filter(r => r.status === 'in-progress').length}
                </span>
              </div>
              <div className="bg-white dark:bg-black/50 px-3 py-2 border border-gray-200 dark:border-indigo-600/10 rounded-xl max-w-xs flex flex-col justify-center shadow-sm">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Resolved</span>
                <span className="text-base font-bold text-emerald-500">
                  {reports.filter(r => r.status === 'resolved').length}
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters Strip */}
          <div className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-gray-200 dark:border-indigo-600/15 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-450 dark:text-gray-550" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Query ticket titles, details, or student emails..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-black/40 border border-gray-250 dark:border-gray-800 rounded-xl text-xs md:text-sm text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Status filter dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-indigo-500 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-black/40 border border-gray-250 dark:border-gray-800 rounded-xl text-xs text-gray-800 dark:text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Investigation</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Severity filter dropdown */}
              <div className="w-full sm:w-auto">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-black/40 border border-gray-250 dark:border-gray-800 rounded-xl text-xs text-gray-800 dark:text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Urgencies</option>
                  <option value="low">Low Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="high">High Severity</option>
                  <option value="critical">Critical Urgency</option>
                </select>
              </div>

              {/* Category selector */}
              <div className="w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-black/40 border border-gray-250 dark:border-gray-800 rounded-xl text-xs text-gray-800 dark:text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="ui">UI & Polish</option>
                  <option value="functional">Functional Bug</option>
                  <option value="performance">Performance</option>
                  <option value="content">Lesson / Course Content</option>
                  <option value="other">General Inquiries</option>
                </select>
              </div>

            </div>
          </div>

          {/* Central Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Table or list - 7 Cols */}
            <div className="lg:col-span-7 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-indigo-600/15 shadow-sm overflow-hidden min-h-[500px]">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-3 text-gray-400">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                  <p className="text-xs font-semibold">Retrieving student reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 dark:bg-black/20 flex items-center justify-center border border-gray-155 dark:border-gray-800 text-gray-400">
                    <Bug className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No Tickets Found</h3>
                    <p className="text-xs text-gray-550 dark:text-gray-400 max-w-sm mx-auto">
                      All filters cleared? No submissions matched current criteria.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800/60 max-h-[600px] overflow-y-auto">
                  {filteredReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-4 hover:bg-slate-50/50 dark:hover:bg-neutral-900/30 transition-all flex flex-col space-y-3 ${
                        selectedReport?.id === report.id
                          ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-l-4 border-indigo-500'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm line-clamp-1 leading-snug">
                            {report.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                            <span className="flex items-center space-x-1 font-semibold text-gray-650 dark:text-gray-300">
                              <User className="w-3 h-3 text-gray-450" />
                              <span>{report.userName}</span>
                            </span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {getStatusBadge(report.status)}
                          <div className="flex items-center space-x-1.5">
                            {getSeverityBadge(report.severity)}
                            <span className="text-[10px] bg-slate-100 dark:bg-black/60 border border-gray-200 dark:border-gray-850 px-1.5 py-0.5 rounded font-medium text-gray-500 capitalize">
                              {report.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>

                      {report.adminNotes && (
                        <div className="flex items-center space-x-1 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400 self-start font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>Has Resolution Notes</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution Edit Panel - 5 Cols */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-indigo-600/15 shadow-sm p-5 space-y-5">
                <div className="border-b border-gray-200 dark:border-gray-800/80 pb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span>Ticket Resolution Details</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Select a student report on the left panel to update actions.
                  </p>
                </div>

                {selectedReport ? (
                  <div className="space-y-5">
                    {/* Reporter card */}
                    <div className="bg-slate-50 dark:bg-black/40 p-3 rounded-xl border border-gray-250 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Reporter Profile</span>
                        <span className="text-[10px] font-mono font-medium text-indigo-600 dark:text-lime-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          Id: {selectedReport.id.substring(1, 8)}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 font-bold">
                          <User className="w-3.5 h-3.5 text-gray-450" />
                          <span>{selectedReport.userName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                          <Mail className="w-3.5 h-3.5 text-gray-450" />
                          <span className="truncate">{selectedReport.userEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Report summary text */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-gray-400 block uppercase">Issue Statement</span>
                      <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-gray-250 dark:border-gray-850/50">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-white mb-2 pb-1 border-b border-gray-200/50 dark:border-gray-800/30">
                          {selectedReport.title}
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line max-h-[140px] overflow-y-auto">
                          {selectedReport.description}
                        </p>
                      </div>
                    </div>

                    {/* Core action/update Form */}
                    <form onSubmit={handleUpdateStatusAndNotes} className="space-y-4">
                      
                      {/* Status select dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-2">
                          Resolution Status
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black/40 border border-gray-250 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer border-indigo-500/30"
                        >
                          <option value="pending">Pending Review (Idle)</option>
                          <option value="in-progress">In Investigation / Progress</option>
                          <option value="resolved">Resolved / Fixed</option>
                          <option value="closed">Closed / Discarded</option>
                        </select>
                      </div>

                      {/* Developer Admin notes */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-2">
                          Resolution notes (Visible to student)
                        </label>
                        <textarea
                          value={editAdminNotes}
                          onChange={(e) => setEditAdminNotes(e.target.value)}
                          placeholder="Provide the fix explanation, timeline, or steps you have completed..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black/40 border border-gray-250 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none min-h-[110px] max-h-[220px]"
                        ></textarea>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-805 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isUpdating ? 'Saving...' : 'Update Details'}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>

                    </form>

                  </div>
                ) : (
                  <div className="py-20 text-center text-gray-400">
                    <Bug className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                    <p className="text-xs">No ticket clicked for resolution.</p>
                  </div>
                )}
              </div>

              {/* Polish Guidelines Promo Box */}
              <div className="bg-gradient-to-br from-[#121212] to-neutral-900 border border-indigo-500/20 rounded-2xl p-4 text-white flex items-start space-x-3">
                <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-xl flex-shrink-0">
                  <AlertOctagon className="w-5 h-5 text-lime-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-sans flex items-center space-x-1.5 text-lime-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>LMS Quality Mandate</span>
                  </h4>
                  <p className="text-[11px] text-gray-405 leading-relaxed">
                    Always include actionable developer details. Students receive ambient notifications once a bug gets marked <strong>Resolved</strong>!
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] shadow-2xl border-2 border-red-500/30 rounded-2xl max-w-sm w-full p-6 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Confirm Ticket Deletion</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete this bug and support report? This action cannot be undone.
            </p>
            <div className="flex space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-black/50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-800 dark:text-gray-300 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-xs font-semibold text-white rounded-xl transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BugsAndReportsManagement;
