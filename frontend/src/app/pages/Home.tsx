import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, PlusCircle, MessageSquare, Calendar } from "lucide-react";
import { Link } from "react-router";
import ListingCard from "../components/ListingCard";
import { toast } from "sonner";
import { bookingsAPI, listingsAPI, messagesAPI } from "../../services/api";
import { toBooking, toConversation, toListing } from "../../services/normalizers";
import { useAuthStore } from "../../store/authStore";

const categories = [
  { id: "all", label: "All" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "clothing", label: "Clothing" },
  { id: "sports", label: "Sports" },
  { id: "tools", label: "Tools" },
  { id: "other", label: "Other" }
];

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const initializedNotificationsRef = useRef(false);

  const loadListings = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await listingsAPI.getAll();
      setListings((res.data || []).map(toListing));
    } catch (error) {
      console.error('Failed to load listings', error);
      if (showLoader) setListings([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(true);
    const interval = setInterval(() => {
      loadListings(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadListings]);

  useEffect(() => {
    if (!user?.id) return;

    const seenMessageKey = `campusrent-seen-message-ids-${user.id}`;
    const bookingStatusKey = `campusrent-booking-status-${user.id}`;

    const readSeenMessageIds = () => {
      try {
        return new Set(JSON.parse(localStorage.getItem(seenMessageKey) || '[]'));
      } catch {
        return new Set<string>();
      }
    };

    const saveSeenMessageIds = (ids: Set<string>) => {
      localStorage.setItem(seenMessageKey, JSON.stringify(Array.from(ids).slice(-300)));
    };

    const readBookingStatuses = () => {
      try {
        return JSON.parse(localStorage.getItem(bookingStatusKey) || '{}');
      } catch {
        return {};
      }
    };

    const saveBookingStatuses = (statuses: Record<string, string>) => {
      localStorage.setItem(bookingStatusKey, JSON.stringify(statuses));
    };

    const notifyBookingChange = (booking: any, tab: 'renting' | 'lending') => {
      const title = booking?.listing?.title || 'item';
      const location = booking?.listing?.location || booking?.listing?.pickupLocation || 'On Campus';
      const deadline = booking?.endDate ? new Date(booking.endDate).toLocaleString() : 'N/A';
      if (tab === 'lending' && booking.status === 'pending') {
        const renterName = booking?.renter?.name || 'A renter';
        toast.info(`New order: ${title}`, {
          description: `${renterName} requested it. Location: ${location}. Deadline: ${deadline}`,
        });
        return;
      }
      if (tab === 'lending' && booking.status === 'active') {
        const renterName = booking?.renter?.name || 'Renter';
        toast.success(`Order approved: ${title}`, {
          description: `${renterName} will pick up at ${location}. Deadline: ${deadline}`,
        });
        return;
      }
      if (booking.status === 'active') {
        toast.success(`Booking confirmed: ${title}`, {
          description: `Pickup at ${location}. Deadline: ${deadline}`,
        });
        return;
      }
      if (booking.status === 'completed') {
        toast(`Booking completed for ${title}`);
        return;
      }
      if (booking.status === 'cancelled') {
        toast(`Booking cancelled for ${title}`);
      }
    };

    const notifyMessage = (conversation: any) => {
      const lastMessage = conversation?.lastMessage;
      const otherUser = conversation?.otherUser;
      if (!lastMessage?.content) return;

      const content = String(lastMessage.content).toLowerCase();
      if (content.includes('booking') && (content.includes('accepted') || content.includes('confirmed'))) {
        toast.success(`Booking confirmed${conversation?.listing?.title ? ` for ${conversation.listing.title}` : ''}`);
        return;
      }
      if (content.includes('booking') && content.includes('request')) {
        toast.info(`New order placed${conversation?.listing?.title ? ` for ${conversation.listing.title}` : ''}`);
        return;
      }

      toast.info(`New message from ${otherUser?.name || 'a user'}`);
    };

    const checkNotifications = async () => {
      try {
        const [conversationsRes, rentingRes, lendingRes] = await Promise.all([
          messagesAPI.getConversations(),
          bookingsAPI.getMy(),
          bookingsAPI.getLending(),
        ]);

        const conversations = (conversationsRes.data || []).map((c: any) => toConversation(c, user.id));
        const renting = (rentingRes.data || []).map(toBooking);
        const lending = (lendingRes.data || []).map(toBooking);

        const seenMessageIds = readSeenMessageIds();
        const prevBookingStatuses = readBookingStatuses();
        const nextBookingStatuses: Record<string, string> = {};

        // On first run, initialize message snapshots only.
        // We still process bookings so important approvals are visible on dashboard.
        if (!initializedNotificationsRef.current) {
          conversations.forEach((conv: any) => {
            if (conv?.lastMessage?.id) seenMessageIds.add(conv.lastMessage.id);
          });
          saveSeenMessageIds(seenMessageIds);
          initializedNotificationsRef.current = true;
        }

        // Chat notifications
        conversations.forEach((conv: any) => {
          const lastMessageId = conv?.lastMessage?.id;
          const senderId = conv?.lastMessage?.senderId;
          if (!lastMessageId) return;
          if (seenMessageIds.has(lastMessageId)) return;

          seenMessageIds.add(lastMessageId);
          if (senderId && senderId !== user.id) {
            notifyMessage(conv);
          }
        });

        // Booking notifications
        renting.forEach((booking: any) => {
          const prev = prevBookingStatuses[booking.id];
          nextBookingStatuses[booking.id] = booking.status;
          if (!prev && booking.status === 'active') {
            notifyBookingChange(booking, 'renting');
            return;
          }
          if (prev && prev !== booking.status) {
            notifyBookingChange(booking, 'renting');
          }
        });

        lending.forEach((booking: any) => {
          const prev = prevBookingStatuses[booking.id];
          nextBookingStatuses[booking.id] = booking.status;
          if (!prev && booking.status === 'pending') {
            notifyBookingChange(booking, 'lending');
            return;
          }
          if (prev && prev !== booking.status) {
            notifyBookingChange(booking, 'lending');
          }
        });

        saveSeenMessageIds(seenMessageIds);
        saveBookingStatuses(nextBookingStatuses);
      } catch (error) {
        // Silent: notifications should not break dashboard rendering
        console.warn('Notification check failed', error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const featuredListings = useMemo(() => listings.filter((l) => l.featured), [listings]);
  const nearbyListings = useMemo(() => listings.filter((l) => !l.featured).slice(0, 6), [listings]);

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#2D6BE4] rounded-xl flex items-center justify-center">
                <span className="text-white text-xl" style={{ fontFamily: 'var(--font-display)' }}>CR</span>
              </div>
              <span className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                CampusRent
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={user?.id ? '/inbox' : '/signup'}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-[#2D6BE4] text-[#2D6BE4] rounded-xl hover:bg-[#2D6BE4]/5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Inbox</span>
              </Link>

              <Link
                to={user?.id ? '/bookings' : '/signup'}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-[#2D6BE4] text-[#2D6BE4] rounded-xl hover:bg-[#2D6BE4]/5 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>

              <Link
                to={user?.id ? '/post' : '/signup'}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Item</span>
              </Link>

              <Link to={user?.id ? `/profile/${user.id}` : '/signup'}>
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=200"}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <Link to="/search" className="block">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
              <input
                type="text"
                placeholder="Search for items..."
                className="w-full pl-12 pr-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none transition-all"
                readOnly
              />
            </div>
          </Link>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-5 py-2 rounded-full whitespace-nowrap transition-colors ${
                  category.id === "all"
                    ? "bg-[#2D6BE4] text-white"
                    : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#2D6BE4]/10"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {loading && (
          <div className="mb-6 text-[#4B5563]">Loading listings...</div>
        )}

        {/* Featured Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Featured Listings
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        {/* Near You Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Near You
            </h2>
            <Link to="/search" className="text-[#2D6BE4] hover:underline">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {!loading && listings.length === 0 && (
            <div className="mt-6 text-[#4B5563]">No listings available yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
