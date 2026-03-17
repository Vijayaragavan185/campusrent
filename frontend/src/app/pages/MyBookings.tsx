import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { bookingsAPI, reviewsAPI, paymentsAPI } from "../../services/api";
import { toBooking } from "../../services/normalizers";
import { useAuthStore } from "../../store/authStore";

type TabType = "renting" | "lending";
type UpdateStatus = 'accepted' | 'rejected' | 'cancelled' | 'requested_return' | 'returned' | 'completed';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDaysRemaining(endDate: string, providedDaysRemaining?: number | null) {
  if (typeof providedDaysRemaining === 'number') return providedDaysRemaining;
  const end = new Date(endDate);
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / MS_PER_DAY);
}

function getCountdownDisplay(booking: any) {
  const lifecycleStatus = booking.lifecycleStatus || booking.status;
  if (!['accepted', 'active', 'requested_return', 'returned'].includes(lifecycleStatus)) {
    return null;
  }

  const daysRemaining = toDaysRemaining(booking.endDate, booking.daysRemaining);
  const overdue = Boolean(booking.isOverdue || daysRemaining < 0);
  if (overdue) {
    return {
      label: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`,
      className: 'bg-[#E74C3C]/10 text-[#E74C3C]',
    };
  }

  if (daysRemaining === 0) {
    return {
      label: 'Due today',
      className: 'bg-[#F4A623]/10 text-[#F4A623]',
    };
  }

  return {
    label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to return`,
    className: 'bg-[#2D6BE4]/10 text-[#2D6BE4]',
  };
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<TabType>("renting");
  const [rentingBookings, setRentingBookings] = useState<any[]>([]);
  const [lendingBookings, setLendingBookings] = useState<any[]>([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [reviewedListingIds, setReviewedListingIds] = useState<Set<string>>(new Set());
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTargetBooking, setReviewTargetBooking] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [extensionTargetBooking, setExtensionTargetBooking] = useState<any | null>(null);
  const [extensionEndDate, setExtensionEndDate] = useState("");
  const [submittingExtension, setSubmittingExtension] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditBooking, setAuditBooking] = useState<any | null>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : '/signup';

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) {
        setRentingBookings([]);
        setLendingBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [rentingRes, lendingRes] = await Promise.all([
          bookingsAPI.getMy(),
          bookingsAPI.getLending(),
        ]);
        setRentingBookings((rentingRes.data || []).map(toBooking));
        setLendingBookings((lendingRes.data || []).map(toBooking));

        const myReviewsRes = await reviewsAPI.getForUser(currentUser.id);
        const myReviewedListingIds = new Set(
          (myReviewsRes.data || []).map((r: any) => r.listingId).filter(Boolean)
        );
        setReviewedListingIds(myReviewedListingIds);
      } catch (error) {
        console.error('Failed to load bookings', error);
        toast.error('Could not load bookings');
        setRentingBookings([]);
        setLendingBookings([]);
        setReviewedListingIds(new Set());
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.id]);

  const bookings = activeTab === "renting" ? rentingBookings : lendingBookings;

  const patchBookingLocally = (bookingId: string, patch: Record<string, any>) => {
    const applyPatch = (booking: any) => (
      booking.id === bookingId ? { ...booking, ...patch } : booking
    );
    setLendingBookings((prev) => prev.map(applyPatch));
    setRentingBookings((prev) => prev.map(applyPatch));
  };

  const updateBookingStatus = async (bookingId: string, status: UpdateStatus) => {
    try {
      setStatusUpdatingId(bookingId);
      await bookingsAPI.updateStatus(bookingId, status);

      const mapStatus = (value: string) => {
        if (value === 'accepted') return 'active';
        if (value === 'rejected') return 'cancelled';
        return value;
      };

      patchBookingLocally(bookingId, {
        status: mapStatus(status),
        lifecycleStatus: status,
        isOverdue: status === 'completed' || status === 'cancelled' ? false : undefined,
      });

      if (status === 'accepted') toast.success('Order approved successfully');
      else if (status === 'rejected') toast.success('Order rejected');
      else if (status === 'requested_return') toast.success('Return request sent to lender');
      else if (status === 'returned') toast.success('Marked as returned');
      else if (status === 'completed') toast.success('Booking marked completed');
      else toast.success('Booking updated');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not update booking status';
      toast.error(message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openExtensionDialog = (booking: any) => {
    setExtensionTargetBooking(booking);
    setExtensionEndDate("");
    setExtensionDialogOpen(true);
  };

  const requestExtension = async () => {
    if (!extensionTargetBooking?.id) return;
    if (!extensionEndDate) {
      toast.error('Please select a new end date');
      return;
    }

    const currentEnd = new Date(extensionTargetBooking.endDate);
    const requested = new Date(extensionEndDate);
    if (requested <= currentEnd) {
      toast.error('New end date must be after current end date');
      return;
    }

    try {
      setSubmittingExtension(true);
      await bookingsAPI.requestExtension(extensionTargetBooking.id, extensionEndDate);
      patchBookingLocally(extensionTargetBooking.id, {
        extensionStatus: 'pending',
        extensionRequestedEndDate: extensionEndDate,
      });
      setExtensionDialogOpen(false);
      setExtensionTargetBooking(null);
      setExtensionEndDate("");
      toast.success('Extension request sent to lender');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to request extension';
      toast.error(message);
    } finally {
      setSubmittingExtension(false);
    }
  };

  const decideExtension = async (bookingId: string, decision: 'approved' | 'rejected') => {
    try {
      setStatusUpdatingId(bookingId);
      const res = await bookingsAPI.decideExtension(bookingId, decision);
      const updated = toBooking(res.data || {});
      patchBookingLocally(bookingId, {
        endDate: updated.endDate,
        extensionStatus: decision,
        extensionRequestedEndDate: null,
      });
      toast.success(decision === 'approved' ? 'Extension approved' : 'Extension rejected');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to update extension request';
      toast.error(message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openReviewDialog = (booking: any) => {
    setReviewTargetBooking(booking);
    setReviewRating(5);
    setReviewComment("");
    setReviewDialogOpen(true);
  };

  const actionLabel: Record<string, string> = {
    created: 'Booking created',
    status_updated: 'Status updated',
    extension_requested: 'Extension requested',
    extension_approved: 'Extension approved',
    extension_rejected: 'Extension rejected',
    auto_completed_on_due_passed: 'Auto-completed after due date',
  };

  const openAuditTimeline = async (booking: any) => {
    try {
      setAuditBooking(booking);
      setAuditDialogOpen(true);
      setAuditLoading(true);
      const res = await bookingsAPI.getAuditTrail(booking.id);
      setAuditEvents(res.data || []);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to load audit timeline';
      toast.error(message);
      setAuditEvents([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handlePayNow = async (booking: any) => {
    try {
      setPayingId(booking.id);
      const { data } = await paymentsAPI.createOrder(booking.id);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'CampusRent',
        description: booking.listing?.title || 'Rental payment',
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            await paymentsAPI.verify({
              bookingId: booking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            patchBookingLocally(booking.id, { paymentStatus: 'paid' });
            toast.success('Payment successful!');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: { color: '#2D6BE4' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      rzp.open();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not initiate payment';
      toast.error(message);
    } finally {
      setPayingId(null);
    }
  };

  const submitReview = async () => {    if (!reviewTargetBooking?.listingId) return;
    if (!reviewComment.trim()) {
      toast.error("Please add a short review comment");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewsAPI.create({
        listingId: reviewTargetBooking.listingId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewedListingIds((prev) => new Set(prev).add(reviewTargetBooking.listingId));
      setReviewDialogOpen(false);
      setReviewTargetBooking(null);
      toast.success("Thanks! Your review was submitted.");
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const statusColors = {
    pending: "bg-[#F4A623] text-white",
    active: "bg-[#27AE60] text-white",
    requested_return: "bg-[#2D6BE4] text-white",
    returned: "bg-[#111827] text-white",
    completed: "bg-[#4B5563] text-white",
    cancelled: "bg-[#E74C3C] text-white"
  };

  const statusLabel: Record<string, string> = {
    pending: 'pending',
    active: 'accepted',
    requested_return: 'return requested',
    returned: 'returned',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <h1 className="text-2xl text-[#111827] mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            My Bookings
          </h1>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("renting")}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                activeTab === "renting"
                  ? "bg-[#2D6BE4] text-white"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#e5e7eb]"
              }`}
            >
              Renting
            </button>
            <button
              onClick={() => setActiveTab("lending")}
              className={`flex-1 py-3 rounded-lg transition-colors ${
                activeTab === "lending"
                  ? "bg-[#2D6BE4] text-white"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#e5e7eb]"
              }`}
            >
              Lending
            </button>
          </div>
        </div>
      </header>

      {/* Bookings List */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {loading && <div className="text-[#4B5563] mb-4">Loading bookings...</div>}

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const countdown = getCountdownDisplay(booking);

              return (
              <div key={booking.id} className="bg-white rounded-xl p-4 shadow-sm">
                <Link to={`/listing/${booking.listing.id}`}>
                  <div className="flex gap-4">
                    <img
                      src={booking.listing.images[0]}
                      alt={booking.listing.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg text-[#111827] line-clamp-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                          {booking.listing.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[booking.status] || statusColors.pending}`}>
                          {statusLabel[booking.status] || booking.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-[#4B5563] mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      {countdown && (
                        <div className="mb-3">
                          <span className={`inline-flex text-xs px-2.5 py-1 rounded-full ${countdown.className}`}>
                            {countdown.label}
                          </span>
                        </div>
                      )}

                      {Number(booking.potentialLateFee || 0) > 0 && (
                        <div className="mb-3">
                          <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-[#E74C3C]/10 text-[#E74C3C]">
                            Late fee tracked: ${Number(booking.potentialLateFee).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {booking.extensionStatus === 'pending' && (
                        <div className="mb-3">
                          <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-[#2D6BE4]/10 text-[#2D6BE4]">
                            Extension pending {booking.extensionRequestedEndDate ? `to ${new Date(booking.extensionRequestedEndDate).toLocaleDateString()}` : ''}
                          </span>
                          {formatDateTimeLabel(booking.extensionRequestedAt) && (
                            <p className="text-xs text-[#4B5563] mt-1">
                              Requested on {formatDateTimeLabel(booking.extensionRequestedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {booking.extensionStatus === 'approved' && (
                        <div className="mb-3">
                          <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-[#27AE60]/10 text-[#27AE60]">
                            Extension approved
                          </span>
                          {formatDateTimeLabel(booking.extensionResolvedAt) && (
                            <p className="text-xs text-[#4B5563] mt-1">
                              Approved on {formatDateTimeLabel(booking.extensionResolvedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {booking.extensionStatus === 'rejected' && (
                        <div className="mb-3">
                          <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-[#E74C3C]/10 text-[#E74C3C]">
                            Extension rejected
                          </span>
                          {formatDateTimeLabel(booking.extensionResolvedAt) && (
                            <p className="text-xs text-[#4B5563] mt-1">
                              Rejected on {formatDateTimeLabel(booking.extensionResolvedAt)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={booking.listing.owner.avatar}
                            alt={booking.listing.owner.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-[#4B5563]">
                            {activeTab === 'renting'
                              ? booking.listing.owner.name
                              : `Requested by ${booking.renter?.name || 'Renter'}`}
                          </span>
                        </div>
                        
                        <div className="text-lg text-[#2D6BE4]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                          ${booking.totalPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openAuditTimeline(booking)}
                    className="w-full py-2 border border-[#4B5563] text-[#4B5563] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                  >
                    Audit Timeline
                  </button>
                </div>

                {activeTab === "renting" && booking.paymentStatus !== 'paid' && !['cancelled', 'rejected', 'completed'].includes(booking.status) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handlePayNow(booking)}
                      disabled={payingId === booking.id}
                      className="w-full py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors disabled:opacity-60 font-semibold"
                    >
                      {payingId === booking.id ? 'Opening Payment...' : `Pay ₹${Number(booking.totalPrice).toFixed(2)}`}
                    </button>
                  </div>
                )}

                {activeTab === "renting" && booking.paymentStatus === 'paid' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="w-full py-2 bg-[#27AE60]/10 text-[#27AE60] rounded-lg text-center text-sm font-medium">
                      ✓ Payment received
                    </div>
                  </div>
                )}

                {booking.status === "completed" && activeTab === "renting" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {reviewedListingIds.has(booking.listingId) ? (
                      <div className="w-full py-2 bg-[#F3F4F6] text-[#4B5563] rounded-lg text-center">
                        Review submitted
                      </div>
                    ) : (
                      <button
                        onClick={() => openReviewDialog(booking)}
                        className="w-full py-2 border-2 border-[#F4A623] text-[#F4A623] rounded-lg hover:bg-[#F4A623] hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Leave a Review
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "lending" && booking.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'rejected')}
                      disabled={statusUpdatingId === booking.id}
                      className="flex-1 py-2 border border-[#E74C3C] text-[#E74C3C] rounded-lg hover:bg-[#E74C3C] hover:text-white transition-colors disabled:opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'accepted')}
                      disabled={statusUpdatingId === booking.id}
                      className="flex-1 py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors disabled:opacity-60"
                    >
                      {statusUpdatingId === booking.id ? 'Updating...' : 'Approve Order'}
                    </button>
                  </div>
                )}

                {activeTab === "renting" && booking.status === "active" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'requested_return')}
                      disabled={statusUpdatingId === booking.id}
                      className="w-full py-2 bg-[#2D6BE4] text-white rounded-lg hover:bg-[#2557b8] transition-colors disabled:opacity-60"
                    >
                      {statusUpdatingId === booking.id ? 'Submitting...' : 'Request Return'}
                    </button>

                    {booking.extensionStatus !== 'pending' && (
                      <button
                        onClick={() => openExtensionDialog(booking)}
                        className="w-full mt-2 py-2 border border-[#2D6BE4] text-[#2D6BE4] rounded-lg hover:bg-[#2D6BE4]/5 transition-colors"
                      >
                        Request Extension
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "lending" && booking.extensionStatus === "pending" && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => decideExtension(booking.id, 'rejected')}
                      disabled={statusUpdatingId === booking.id}
                      className="flex-1 py-2 border border-[#E74C3C] text-[#E74C3C] rounded-lg hover:bg-[#E74C3C] hover:text-white transition-colors disabled:opacity-60"
                    >
                      Reject Extension
                    </button>
                    <button
                      onClick={() => decideExtension(booking.id, 'approved')}
                      disabled={statusUpdatingId === booking.id}
                      className="flex-1 py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors disabled:opacity-60"
                    >
                      Approve Extension
                    </button>
                  </div>
                )}

                {activeTab === "lending" && booking.status === "requested_return" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'returned')}
                      disabled={statusUpdatingId === booking.id}
                      className="w-full py-2 bg-[#111827] text-white rounded-lg hover:bg-black transition-colors disabled:opacity-60"
                    >
                      {statusUpdatingId === booking.id ? 'Updating...' : 'Mark as Returned'}
                    </button>
                  </div>
                )}

                {activeTab === "lending" && booking.status === "returned" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      disabled={statusUpdatingId === booking.id}
                      className="w-full py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors disabled:opacity-60"
                    >
                      {statusUpdatingId === booking.id ? 'Finalizing...' : 'Complete Booking'}
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-[#4B5563]" />
            </div>
            <h3 className="text-xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {activeTab === "renting" ? "No rentals yet" : "No items being rented"}
            </h3>
            <p className="text-[#4B5563] mb-6">
              {activeTab === "renting" 
                ? "Start browsing to rent your first item"
                : "Lending shows booking requests on your listed items. Your listings are in your profile."}
            </p>
            <Link
              to={activeTab === "renting" ? "/home" : profilePath}
              className="inline-block px-6 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
            >
              {activeTab === "renting" ? "Browse Listings" : "View My Listings"}
            </Link>
          </div>
        )}
      </main>

      <Dialog.Root open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-2xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Leave a Review
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#4B5563] mb-5">
              Share your experience for {reviewTargetBooking?.listing?.title || 'this listing'}.
            </Dialog.Description>

            <div className="mb-4">
              <label className="block text-[#111827] mb-2">Rating</label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${value <= reviewRating ? "text-[#F4A623] fill-[#F4A623]" : "text-gray-300"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[#111827] mb-2">Comment</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                placeholder="How was the rental experience?"
                className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Dialog.Close className="flex-1 py-3 border border-gray-300 text-[#4B5563] rounded-xl hover:bg-[#F3F4F6] transition-colors">
                Cancel
              </Dialog.Close>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="flex-1 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors disabled:bg-gray-300"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-2xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Request Extension
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[#4B5563] mb-4">
              Choose a new return date for {extensionTargetBooking?.listing?.title || 'this booking'}.
            </Dialog.Description>

            <div className="mb-5">
              <label className="block text-[#111827] mb-2">New End Date</label>
              <input
                type="date"
                value={extensionEndDate}
                onChange={(e) => setExtensionEndDate(e.target.value)}
                min={extensionTargetBooking?.endDate ? new Date(new Date(extensionTargetBooking.endDate).getTime() + 86400000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3">
              <Dialog.Close className="flex-1 py-3 border border-gray-300 text-[#4B5563] rounded-xl hover:bg-[#F3F4F6] transition-colors">
                Cancel
              </Dialog.Close>
              <button
                onClick={requestExtension}
                disabled={submittingExtension}
                className="flex-1 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors disabled:bg-gray-300"
              >
                {submittingExtension ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl p-6 z-50 overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <Dialog.Title className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  Audit Timeline
                </Dialog.Title>
                <Dialog.Description className="text-sm text-[#4B5563] mt-1">
                  {auditBooking?.listing?.title || 'Booking'}
                </Dialog.Description>
              </div>
              <Dialog.Close className="px-3 py-1.5 rounded-md border border-gray-300 text-[#4B5563] hover:bg-[#F3F4F6]">
                Close
              </Dialog.Close>
            </div>

            {auditLoading ? (
              <div className="text-[#4B5563]">Loading timeline...</div>
            ) : auditEvents.length === 0 ? (
              <div className="text-[#4B5563]">No audit events available yet.</div>
            ) : (
              <div className="space-y-4">
                {auditEvents.map((event: any) => (
                  <div key={event.id} className="border border-gray-200 rounded-xl p-3">
                    <div className="text-sm text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {actionLabel[event.action] || event.action}
                    </div>
                    <div className="text-xs text-[#4B5563] mt-1">
                      {event.fromStatus
                        ? `${event.fromStatus} → ${event.toStatus}`
                        : `to ${event.toStatus}`}
                    </div>
                    <div className="text-xs text-[#4B5563] mt-1">
                      {formatDateTimeLabel(event.createdAt) || 'N/A'}
                    </div>
                    {event.metadata && (
                      <pre className="mt-2 text-[11px] bg-[#F3F4F6] text-[#4B5563] rounded-md p-2 overflow-x-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
