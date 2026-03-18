import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, BarChart3, Users, FileText, DollarSign, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../services/api";

const adminAPI = {
  getDashboardInfo: () => fetch('/api/admin/dashboard/info', {
    headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` }
  }).then((r) => r.json()),
  getAllBookings: (status: string | null, limit: number = 50, offset: number = 0) => fetch(
    `/api/admin/bookings?${status ? `status=${status}&` : ''}limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } }
  ).then((r) => r.json()),
  getAllPayouts: (status: string | null, limit: number = 50, offset: number = 0) => fetch(
    `/api/admin/payouts?${status ? `status=${status}&` : ''}limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } }
  ).then((r) => r.json()),
  markPayoutProcessed: (payoutId: string, transactionId: string = '') => fetch(
    `/api/admin/payouts/${payoutId}/mark-processed`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ transactionId })
    }
  ).then((r) => r.json()),
  getAllUsers: (limit: number = 50, offset: number = 0, search: string = '') => fetch(
    `/api/admin/users?limit=${limit}&offset=${offset}${search ? `&search=${search}` : ''}`,
    { headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } }
  ).then((r) => r.json()),
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Check admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/home');
      return;
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardInfo, setDashboardInfo] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadDashboardInfo();
    } else if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'payouts') {
      loadPayouts();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadDashboardInfo = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboardInfo();
      setDashboardInfo(data);
    } catch (err) {
      toast.error('Failed to load dashboard info');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllBookings(null, 50, 0);
      setBookings(data.bookings);
    } catch (err) {
      toast.error('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllPayouts(null, 50, 0);
      setPayouts(data.payouts);
    } catch (err) {
      toast.error('Failed to load payouts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers(50, 0);
      setUsers(data.users);
    } catch (err) {
      toast.error('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPayoutProcessed = async (payoutId: string) => {
    try {
      setProcessingPayoutId(payoutId);
      const result = await adminAPI.markPayoutProcessed(payoutId, '');
      if (result.success) {
        toast.success('Payout marked as processed');
        loadPayouts();
      } else {
        toast.error(result.error || 'Failed to update payout');
      }
    } catch (err) {
      toast.error('Error marking payout as processed');
      console.error(err);
    } finally {
      setProcessingPayoutId(null);
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6] min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link to="/home" className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D6BE4] transition-colors mb-3">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#4B5563] mt-1">Logged in as {user?.email}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl overflow-hidden mb-6">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'bookings', label: 'Bookings', icon: FileText },
              { id: 'payouts', label: 'Payouts', icon: DollarSign },
              { id: 'users', label: 'Users', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 flex items-center gap-2 font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#2D6BE4] border-b-2 border-[#2D6BE4]'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : dashboardInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {[
                  { label: 'Total Users', value: dashboardInfo.stats.totalUsers, color: '#2D6BE4' },
                  { label: 'Total Listings', value: dashboardInfo.stats.totalListings, color: '#27AE60' },
                  { label: 'Total Bookings', value: dashboardInfo.stats.totalBookings, color: '#F39C12' },
                  { label: 'Total Payments', value: `₹${dashboardInfo.stats.totalPaymentAmount.toFixed(2)}`, color: '#9B59B6' },
                  { label: 'Pending Payouts', value: dashboardInfo.stats.pendingPayouts, color: '#E74C3C' },
                  { label: 'Processed Payouts', value: `₹${dashboardInfo.stats.totalProcessedPayoutAmount.toFixed(2)}`, color: '#16A085' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6">
                    <p className="text-sm text-[#4B5563] mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Recent Bookings */}
            {dashboardInfo?.recentBookings && (
              <div className="bg-white rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4">Listing</th>
                        <th className="text-left py-2 px-4">Renter</th>
                        <th className="text-left py-2 px-4">Amount</th>
                        <th className="text-left py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardInfo.recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{booking.listing.title}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <p className="font-semibold">{booking.renter.name}</p>
                              <p className="text-gray-500">{booking.renter.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">₹{booking.payment?.amount.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.payment?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.payment?.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">All Bookings</h3>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4">Listing</th>
                      <th className="text-left py-2 px-4">Renter</th>
                      <th className="text-left py-2 px-4">Amount</th>
                      <th className="text-left py-2 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{booking.listing.title}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="font-semibold">{booking.renter.name}</p>
                            <p className="text-gray-500">{booking.renter.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">₹{booking.payment?.amount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">All Payouts</h3>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4">Lender</th>
                      <th className="text-left py-2 px-4">UPI</th>
                      <th className="text-left py-2 px-4">Amount</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-semibold">{payout.booking?.booking?.renter?.name}</p>
                        </td>
                        <td className="py-3 px-4">{payout.upiId}</td>
                        <td className="py-3 px-4">₹{(payout.amountInPaise / 100).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            payout.status === 'processed' ? 'bg-green-100 text-green-700' :
                            payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {payout.status === 'pending' && (
                            <button
                              onClick={() => handleMarkPayoutProcessed(payout.id)}
                              disabled={processingPayoutId === payout.id}
                              className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60 text-xs"
                            >
                              <Check className="w-3 h-3" />
                              Mark Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">All Users</h3>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Email</th>
                      <th className="text-left py-2 px-4">Verified</th>
                      <th className="text-left py-2 px-4">Lister</th>
                      <th className="text-left py-2 px-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{u.name}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                          {u.verified ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                        </td>
                        <td className="py-3 px-4">
                          {u.isLister ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                        </td>
                        <td className="py-3 px-4">{u.rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sign Out */}
        <div className="mt-8">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#E74C3C] text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <X className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
