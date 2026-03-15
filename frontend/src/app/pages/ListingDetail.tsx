import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, MapPin, CheckCircle, Calendar as CalendarIcon, MessageSquare, Pencil, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { bookingsAPI, listingsAPI, reviewsAPI } from "../../services/api";
import { toListing, toReview } from "../../services/normalizers";
import { useAuthStore } from "../../store/authStore";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";

function getDateRangeKeys(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [listing, setListing] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const blockedDateSet = useMemo(() => {
    if (!listing?.blockedDates) return new Set<string>();
    return new Set((listing.blockedDates || []).map((value: string) => String(value).slice(0, 10)));
  }, [listing?.blockedDates]);

  const isDateBlocked = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (normalized < today) return true;
    const key = normalized.toISOString().slice(0, 10);
    return blockedDateSet.has(key);
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const [listingRes, reviewsRes] = await Promise.all([
          listingsAPI.getOne(id),
          reviewsAPI.getForListing(id),
        ]);

        setListing(toListing(listingRes.data));
        setReviews((reviewsRes.data || []).map(toReview));
      } catch (error) {
        console.error('Failed to load listing', error);
        toast.error('Could not load listing details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const conversationId = useMemo(() => {
    if (!currentUser?.id || !listing?.owner?.id || !listing?.id) return null;
    return [currentUser.id, listing.owner.id].sort().join('_') + `_${listing.id}`;
  }, [currentUser?.id, listing?.owner?.id, listing?.id]);

  if (loading) {
    return <div className="p-6">Loading listing...</div>;
  }

  if (!listing) {
    return <div>Listing not found</div>;
  }

  const conditionColors = {
    new: "text-[#27AE60] bg-[#27AE60]/10",
    good: "text-[#2D6BE4] bg-[#2D6BE4]/10",
    fair: "text-[#F4A623] bg-[#F4A623]/10"
  };

  const isOwnListing = Boolean(
    currentUser?.id &&
    (currentUser.id === listing.owner?.id || currentUser.id === listing.ownerId)
  );

  const handleBookingSubmit = async () => {
    if (!currentUser?.id) {
      toast.error("Please sign in to request booking");
      navigate('/login');
      return;
    }

    if (isOwnListing) {
      toast.error("You cannot book your own listing");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      toast.error("End date must be after start date");
      return;
    }

    const blockedDates = new Set((listing.blockedDates || []).map((value: string) => String(value).slice(0, 10)));
    const selectedDateKeys = getDateRangeKeys(startDate, endDate);
    const overlapsBlockedDates = selectedDateKeys.some((key) => blockedDates.has(key));
    if (overlapsBlockedDates) {
      toast.error("Selected dates include already-booked days. Please choose another range.");
      return;
    }

    const total = days * listing.pricePerDay;

    try {
      await bookingsAPI.create({
        listingId: listing.id,
        startDate,
        endDate,
        totalCost: total,
      });

      toast.success(`Booking request sent! Total: $${total} for ${days} days`);
      setBookingDialogOpen(false);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to send booking request';
      toast.error(message);
    }
  };

  return (
    <div className="pb-20 md:pb-8 bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <Link to="/home" className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D6BE4] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </header>

      {/* Image Carousel */}
      <div className="relative aspect-[16/9] bg-gray-900">
        <img
          src={listing.images[currentImageIndex]}
          alt={listing.title}
          className="w-full h-full object-contain"
        />
        {listing.images.length > 1 && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {listing.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
            {currentImageIndex > 0 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#111827]" />
              </button>
            )}
            {currentImageIndex < listing.images.length - 1 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors rotate-180"
              >
                <ArrowLeft className="w-5 h-5 text-[#111827]" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Title and Price */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-3xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {listing.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                  listing.status === "available" ? "bg-[#27AE60] text-white" :
                  listing.status === "rented" ? "bg-[#4B5563] text-white" :
                  "bg-[#F4A623] text-white"
                }`}>
                  {listing.availabilityLabel || listing.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-[#F4A623] fill-[#F4A623]" />
                  <span className="text-lg">{listing.rating.toFixed(1)}</span>
                  <span className="text-[#4B5563]">({listing.reviewCount} reviews)</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm capitalize ${conditionColors[listing.condition]}`}>
                  {listing.condition} condition
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#4B5563]">
                <MapPin className="w-5 h-5" />
                <span>{listing.pickupLocation}</span>
              </div>
            </div>

            {/* Owner Info */}
            <Link to={`/profile/${listing.owner.id}`}>
              <div className="flex items-center gap-4 p-4 bg-[#F3F4F6] rounded-xl mb-6 hover:bg-[#e5e7eb] transition-colors">
                <img
                  src={listing.owner.avatar}
                  alt={listing.owner.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {listing.owner.name}
                    </span>
                    {listing.owner.verified && (
                      <div className="w-5 h-5 bg-[#2D6BE4] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[#4B5563]">
                    <Star className="w-4 h-4 text-[#F4A623] fill-[#F4A623]" />
                    <span>{Number(listing.owner.rating || 0).toFixed(1)}</span>
                    <span>•</span>
                    <span>{listing.owner.totalRentals || 0} rentals</span>
                  </div>
                </div>
                <span className="text-[#2D6BE4]">View Profile →</span>
              </div>
            </Link>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl text-[#111827] mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Description
              </h2>
              <p className="text-[#4B5563] leading-relaxed">{listing.description}</p>
            </div>

            {/* Details */}
            <div className="mb-6">
              <h2 className="text-xl text-[#111827] mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#F3F4F6] rounded-lg">
                  <div className="text-sm text-[#4B5563] mb-1">Category</div>
                  <div className="text-[#111827] capitalize">{listing.category}</div>
                </div>
                <div className="p-3 bg-[#F3F4F6] rounded-lg">
                  <div className="text-sm text-[#4B5563] mb-1">Condition</div>
                  <div className="text-[#111827] capitalize">{listing.condition}</div>
                </div>
                <div className="p-3 bg-[#F3F4F6] rounded-lg col-span-2">
                  <div className="text-sm text-[#4B5563] mb-1">Pickup Location</div>
                  <div className="text-[#111827]">{listing.pickupLocation}</div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl text-[#111827] mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Reviews ({reviews.length})
              </h2>
              {reviews.map((review) => (
                <div key={review.id} className="mb-4 p-4 bg-[#F3F4F6] rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        {review.user.name}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "text-[#F4A623] fill-[#F4A623]" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-[#4B5563]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[#4B5563]">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <div className="text-4xl text-[#2D6BE4] mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  ${listing.pricePerDay}
                </div>
                <div className="text-[#4B5563]">per day</div>
              </div>

              <button
                onClick={() => setBookingDialogOpen(true)}
                disabled={listing.status !== "available" || isOwnListing}
                className="w-full py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-3"
              >
                {isOwnListing
                  ? "This is your listing"
                    : listing.status === "available"
                    ? "Request to Rent"
                      : listing.availabilityLabel || "Not Available"}
              </button>

              {isOwnListing ? (
                <Link to={`/listing/${listing.id}/edit`}>
                  <button className="w-full py-3 border-2 border-[#2D6BE4] text-[#2D6BE4] rounded-xl hover:bg-[#2D6BE4]/5 transition-colors flex items-center justify-center gap-2">
                    <Pencil className="w-5 h-5" />
                    Edit Listing
                  </button>
                </Link>
              ) : (
                <Link to={conversationId ? `/chat/${conversationId}` : '/signup'}>
                  <button className="w-full py-3 border-2 border-[#2D6BE4] text-[#2D6BE4] rounded-xl hover:bg-[#2D6BE4]/5 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Message Owner
                  </button>
                </Link>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-[#4B5563] mb-2">
                  <CheckCircle className="w-4 h-4 text-[#27AE60]" />
                  <span>Meet on campus for pickup</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                  <CheckCircle className="w-4 h-4 text-[#27AE60]" />
                  <span>Verified university member</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog.Root open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-2xl text-[#111827] mb-6" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Request Booking
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Choose your rental start and end dates to send a booking request for this listing.
            </Dialog.Description>

            <div className="mb-4">
              <label className="block text-[#111827] mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-2" />
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none flex items-center justify-between"
                  >
                    <span className={startDate ? "text-[#111827]" : "text-[#9CA3AF]"}>
                      {startDate ? format(new Date(startDate), 'PPP') : 'Select start date'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#4B5563]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    disabled={isDateBlocked}
                    onSelect={(date) => {
                      if (!date) return;
                      const selectedStart = date.toISOString().slice(0, 10);
                      setStartDate(selectedStart);
                      if (endDate && new Date(endDate) <= date) {
                        setEndDate("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {Array.isArray(listing.blockedDates) && listing.blockedDates.length > 0 && (
                <p className="mt-2 text-xs text-[#4B5563]">
                  {listing.blockedDates.length} date(s) are currently blocked by existing rentals.
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-[#111827] mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-2" />
                End Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none flex items-center justify-between"
                  >
                    <span className={endDate ? "text-[#111827]" : "text-[#9CA3AF]"}>
                      {endDate ? format(new Date(endDate), 'PPP') : 'Select end date'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#4B5563]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    disabled={(date) => {
                      if (isDateBlocked(date)) return true;
                      if (!startDate) return false;
                      return date <= new Date(startDate);
                    }}
                    onSelect={(date) => {
                      if (!date) return;
                      const selectedEnd = date.toISOString().slice(0, 10);
                      setEndDate(selectedEnd);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {startDate && endDate && (
              <div className="mb-6 p-4 bg-[#F3F4F6] rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-[#4B5563]">
                    ${listing.pricePerDay} x {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                  <span className="text-[#111827]">
                    ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) * listing.pricePerDay}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Total</span>
                  <span className="text-[#2D6BE4] text-xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) * listing.pricePerDay}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Dialog.Close className="flex-1 py-3 border border-gray-300 text-[#4B5563] rounded-xl hover:bg-[#F3F4F6] transition-colors">
                Cancel
              </Dialog.Close>
              <button
                onClick={handleBookingSubmit}
                className="flex-1 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
              >
                Send Request
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
