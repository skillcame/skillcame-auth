import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './components/AdminLayout';
import StatsCard from './components/StatsCard';
import GraphChart from './components/GraphChart';
import {
  Users, Shield, UserX, Bell, CreditCard, BookOpen, TrendingUp,
  Activity, GraduationCap, DollarSign, CheckCircle, Clock, AlertTriangle,
  Award, Eye, Loader2, RefreshCw, ArrowRight, Verified, Newspaper, XCircle
} from 'lucide-react';
import {
  watchLimitedUsers,
  watchCourses,
  getAllEnrollments,
  watchAllPayments,
  watchAllNotifications,
  getPaymentRequests,
  watchTotalRevenue,
  watchPendingPaymentRequests,
  watchAdminUnreadNotifications,
  getCourseCompletionStats,
  getDailyActiveUsers,
  getTopCourses,
  watchVerifiedUsersCount,
  watchAIInsightsCount,
  watchPaymentRequestStats
} from '../services/admin/Dashboard';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [completionStats, setCompletionStats] = useState({ completed: 0, total: 0, rate: 0 });
  const [dailyActive, setDailyActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [adminUnreadNotifCount, setAdminUnreadNotifCount] = useState(0);
  const [verifiedUsersCount, setVerifiedUsersCount] = useState(0);
  const [aiInsightsCount, setAiInsightsCount] = useState(0);
  const [paymentRequestStats, setPaymentRequestStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    let isMounted = true;
    const unsubscribers = [];

    const init = async () => {
      try {
        unsubscribers.push(
          watchLimitedUsers(setUsers),
          watchCourses(setCourses),
          watchAllPayments(setPayments),
          watchAllNotifications(setNotifications),
          watchTotalRevenue(setTotalRevenue),
          watchPendingPaymentRequests(setPendingPaymentsCount),
          watchAdminUnreadNotifications(setAdminUnreadNotifCount),
          watchVerifiedUsersCount(setVerifiedUsersCount),
          watchAIInsightsCount(setAiInsightsCount),
          watchPaymentRequestStats(setPaymentRequestStats)
        );

        const [enrollRes, payReqRes, completionRes, dailyRes, topCoursesRes] = await Promise.all([
          getAllEnrollments(),
          getPaymentRequests(),
          getCourseCompletionStats(),
          getDailyActiveUsers(),
          getTopCourses(),
        ]);

        if (isMounted) {
          setEnrollments(enrollRes.success ? enrollRes.data : []);
          setPaymentRequests(payReqRes.success ? payReqRes.data : []);
          if (completionRes.success) setCompletionStats(completionRes);
          if (dailyRes.success) setDailyActive(dailyRes.count);
          if (topCoursesRes.success) setTopCourses(topCoursesRes.data);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        console.error('Dashboard init error:', err);
        if (isMounted) {
          setError('Failed to load dashboard data');
          setLoading(false);
        }
      }
    };
    init();

    return () => {
      isMounted = false;
      unsubscribers.forEach(fn => { if (typeof fn === 'function') fn(); });
    };
  }, []);

  const safeDate = (date) => {
    try {
      if (!date) return '';
      return new Date(date).toISOString().split('T')[0];
    } catch { return ''; }
  };

  const courseRevenueMap = useMemo(() => {
    const map = new Map();
    payments.forEach(payment => {
      if (payment.status === 'approved' && payment.courseId && payment.amount) {
        const amount = parseFloat(payment.amount);
        map.set(payment.courseId, (map.get(payment.courseId) || 0) + amount);
      }
    });
    return map;
  }, [payments]);

  const topRevenueCourses = useMemo(() => {
    return courses
      .map(course => ({
        id: course.id,
        title: course.title,
        revenue: courseRevenueMap.get(course.id) || 0,
        enrollments: enrollments.filter(e => e.courseId === course.id).length,
        views: course.views || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [courses, courseRevenueMap, enrollments]);

  const stats = useMemo(() => {
    const totalUsers = users?.length || 0;
    const totalAdmins = users?.filter(u => u?.role === 'admin').length || 0;
    const totalSuspended = users?.filter(u => u?.status === 'suspended').length || 0;
    const totalEnrollments = enrollments?.length || 0;
    const totalCourses = courses?.length || 0;

    const today = safeDate(new Date().toISOString());
    const todayUsers = users?.filter(u => safeDate(u?.createdAt) === today).length || 0;
    const todayEnrollments = enrollments?.filter(e => safeDate(e?.enrolledAt) === today).length || 0;
    const todayRevenue = payments
      .filter(p => p.status === 'approved' && safeDate(p?.createdAt) === today)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return [
      { title: 'Total Users', value: totalUsers, icon: Users, change: `+${todayUsers} today`, color: 'indigo' },
      { title: 'Admins', value: totalAdmins, icon: Shield, color: 'purple' },
      { title: 'Suspended', value: totalSuspended, icon: UserX, color: 'red' },
      { title: 'Verified Users', value: verifiedUsersCount, icon: Verified, color: 'blue' },
      { title: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'cyan' },
      { title: 'Enrollments', value: totalEnrollments, icon: GraduationCap, change: `+${todayEnrollments} today`, color: 'lime' },
      { title: 'Total Revenue', value: `₨ ${totalRevenue.toLocaleString()}`, icon: DollarSign, change: `+₨ ${todayRevenue.toLocaleString()} today`, color: 'emerald' },
      { title: 'Insights', value: aiInsightsCount, icon: Newspaper, color: 'orange' },
      { title: 'Pending Payments', value: paymentRequestStats.pending, icon: Clock, color: 'yellow' },
      { title: 'Approved Payments', value: paymentRequestStats.approved, icon: CheckCircle, color: 'green' },
      { title: 'Rejected Payments', value: paymentRequestStats.rejected, icon: XCircle, color: 'red' },
      { title: 'Daily Active', value: dailyActive, icon: Activity, color: 'teal' },
      { title: 'Unread Notifications', value: adminUnreadNotifCount, icon: Bell, color: 'pink' },
    ];
  }, [users, enrollments, payments, totalRevenue, dailyActive, adminUnreadNotifCount, courses, verifiedUsersCount, aiInsightsCount, paymentRequestStats]);

  const graphData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return safeDate(d.toISOString());
    });
    return last7Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      Users: users.filter(u => safeDate(u?.createdAt) === date).length,
      Enrollments: enrollments.filter(e => safeDate(e?.enrolledAt) === date).length,
      Payments: payments.filter(p => safeDate(p?.createdAt) === date && p.status === 'approved').length,
      Revenue: payments.filter(p => safeDate(p?.createdAt) === date && p.status === 'approved')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    }));
  }, [users, enrollments, payments]);

  const recentActivities = useMemo(() => {
    const activities = [];
    users.slice(0, 5).forEach(u => {
      if (u.createdAt) activities.push({
        id: `user-${u.uid}`, type: 'user', title: 'New user registered', description: `${u.name || u.email} joined`,
        time: u.createdAt, icon: Users, color: 'indigo'
      });
    });
    enrollments.slice(0, 5).forEach(e => {
      if (e.enrolledAt) {
        const course = courses.find(c => c.id === e.courseId);
        activities.push({
          id: `enroll-${e.userId}-${e.courseId}`, type: 'enrollment', title: 'New enrollment',
          description: `${course?.title || 'Course'} enrolled`, time: e.enrolledAt, icon: GraduationCap, color: 'lime'
        });
      }
    });
    payments.filter(p => p.status === 'approved').slice(0, 5).forEach(p => {
      if (p.createdAt) activities.push({
        id: `payment-${p.id}`, type: 'payment', title: 'Payment received',
        description: `₨ ${parseFloat(p.amount).toLocaleString()} from ${p.userName || p.userId}`,
        time: p.createdAt, icon: DollarSign, color: 'green'
      });
    });
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    return activities.slice(0, 10);
  }, [users, enrollments, payments, courses]);

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen text-red-400">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-bold">{error}</p>
            <p className="text-sm text-gray-400 mt-2">Check Firebase connection or refresh</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              Admin Dashboard
              <span className="text-sm bg-indigo-600/30 px-2 py-1 rounded-full text-indigo-300">Real-time</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Advanced analytics & system overview</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-black/40 px-3 py-1 rounded-full text-xs text-gray-300 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {lastUpdated.toLocaleTimeString()}
            </div>
            <div className="bg-black/40 px-3 py-1 rounded-full text-xs text-gray-300 flex items-center gap-1">
              <Bell className="w-3 h-3" /> {adminUnreadNotifCount} unread
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => <StatsCard key={i} {...stat} />)}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-indigo-600/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> User & Enrollment Trends (Last 7 Days)
            </h3>
            <GraphChart data={graphData} type="line" dataKey="Users" name="Users" color="#6366f1" height={300} />
          </div>
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-indigo-600/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" /> Daily Revenue (PKR)
            </h3>
            <GraphChart data={graphData} type="area" dataKey="Revenue" name="Revenue" color="#10b981" height={300} isCurrency currencyPrefix="₨ " />
          </div>
        </div>

        {/* Advanced Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-indigo-600/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-lime-400" /> Course Completion Rate</h3>
              <span className="text-2xl font-bold text-lime-400">{completionStats.rate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-lime-500 h-2 rounded-full" style={{ width: `${completionStats.rate}%` }}></div></div>
            <p className="text-gray-400 text-sm mt-2">{completionStats.completed} completed out of {completionStats.total} enrollments</p>
          </div>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-indigo-600/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-400" /> Pending Payment Requests</h3>
              <span className="text-2xl font-bold text-yellow-400">{paymentRequestStats.pending}</span>
            </div>
            <p className="text-gray-400 text-sm">{paymentRequestStats.pending > 0 ? 'Needs your attention' : 'All payments processed'}</p>
          </div>
        </div>

        {/* Top Revenue & Top Enrollment Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-indigo-600/20 p-4">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4 text-emerald-400" /> Top 5 Courses by Revenue</h3>
            <div className="space-y-3">
              {topRevenueCourses.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1"><span className="text-gray-500 w-6">{idx+1}.</span><span className="text-gray-200 truncate max-w-[200px]">{c.title}</span></div>
                  <div className="flex gap-3 text-sm"><span className="text-emerald-400 font-semibold">₨ {c.revenue.toLocaleString()}</span><span className="text-lime-400 flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrollments}</span></div>
                </div>
              ))}
              {topRevenueCourses.length === 0 && <p className="text-gray-500 text-sm">No revenue data yet.</p>}
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl border border-indigo-600/20 p-4">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4 text-lime-400" /> Top 5 Courses (by Enrollments)</h3>
            <div className="space-y-3">
              {topCourses.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1"><span className="text-gray-500 w-6">{idx+1}.</span><span className="text-gray-200 truncate max-w-[200px]">{c.title}</span></div>
                  <div className="flex gap-3 text-sm"><span className="text-lime-400 flex items-center gap-1"><Eye className="w-3 h-3" /> {c.views}</span><span className="text-indigo-400 flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrollments}</span></div>
                </div>
              ))}
              {topCourses.length === 0 && <p className="text-gray-500 text-sm">No courses yet.</p>}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-[#1a1a1a] rounded-xl border border-indigo-600/20 p-4">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-lime-400" /> Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {recentActivities.map(act => (
              <div key={act.id} className="flex items-start gap-3 border-b border-gray-800 pb-2">
                <div className={`p-1 rounded-full bg-${act.color}-500/20`}><act.icon className={`w-4 h-4 text-${act.color}-400`} /></div>
                <div className="flex-1"><p className="text-white text-sm font-medium">{act.title}</p><p className="text-gray-400 text-xs">{act.description}</p><p className="text-gray-500 text-xs mt-1">{new Date(act.time).toLocaleString()}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#1a1a1a] p-5 rounded-xl border border-indigo-600/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2"><Activity className="text-lime-400" /><h2 className="text-white font-bold">System Status</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-black/40 p-2 rounded-lg text-center"><p className="text-gray-400">Firebase</p><p className="text-lime-400 font-semibold">Connected</p></div>
              <div className="bg-black/40 p-2 rounded-lg text-center"><p className="text-gray-400">Auth</p><p className="text-lime-400 font-semibold">Active</p></div>
              <div className="bg-black/40 p-2 rounded-lg text-center"><p className="text-gray-400">Storage</p><p className="text-lime-400 font-semibold">Online</p></div>
              <div className="bg-black/40 p-2 rounded-lg text-center"><p className="text-gray-400">Real-time</p><p className="text-lime-400 font-semibold">Active</p></div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
