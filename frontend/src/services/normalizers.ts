type AnyObj = Record<string, any>;

const safeArray = <T = any>(value: any): T[] => Array.isArray(value) ? value : [];
const LISTING_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop';
const isDisplayableImageUrl = (value: any) => {
  if (typeof value !== 'string') return false;
  if (!value.trim()) return false;
  // Blob URLs are temporary and become invalid after reload.
  if (value.startsWith('blob:')) return false;
  return true;
};

function toDateKey(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
}

function getAvailabilityMeta(raw: AnyObj = {}) {
  const blockedDates = safeArray<string>(raw.blockedDates)
    .map((value) => String(value).slice(0, 10))
    .filter(Boolean)
    .sort();

  const blockedDateSet = new Set(blockedDates);
  const today = new Date();
  const todayKey = toDateKey(today);
  const isBlockedToday = blockedDateSet.has(todayKey);
  const isLegacyUnavailable = raw.available === false;

  if (!isBlockedToday && !isLegacyUnavailable) {
    return {
      status: 'available',
      nextAvailableDate: null,
      availabilityLabel: 'available',
      blockedDates,
    };
  }

  if (!isBlockedToday && isLegacyUnavailable) {
    return {
      status: 'rented',
      nextAvailableDate: null,
      availabilityLabel: 'Not available',
      blockedDates,
    };
  }

  const cursor = new Date(today);
  while (blockedDateSet.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const nextAvailableDate = cursor.toISOString();
  const dateLabel = cursor.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return {
    status: 'rented',
    nextAvailableDate,
    availabilityLabel: `Available from ${dateLabel}`,
    blockedDates,
  };
}

export function toUser(raw: AnyObj = {}): AnyObj {
  return {
    id: raw.id,
    name: raw.name || 'Unknown User',
    email: raw.email || '',
    avatar: raw.avatar || 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=200',
    department: raw.department || 'Campus Member',
    yearOfStudy: raw.year || raw.yearOfStudy || '',
    verified: Boolean(raw.verified),
    rating: Number(raw.rating || 0),
    totalRentals: Number(raw.totalRentals || 0),
    itemsListed: Number(raw.itemsListed || 0),
    memberSince: raw.createdAt ? new Date(raw.createdAt).getFullYear().toString() : '2026',
  };
}

export function toListing(raw: AnyObj = {}): AnyObj {
  const owner = toUser(raw.owner || {});
  const reviewCount = Number(raw?._count?.reviews ?? safeArray(raw.reviews).length ?? 0);
  const imageCandidates = safeArray<string>(raw.images).filter(isDisplayableImageUrl);
  const availability = getAvailabilityMeta(raw);
  const avgRating = safeArray(raw.reviews).length
    ? safeArray(raw.reviews).reduce((sum, review) => sum + Number(review.rating || 0), 0) / safeArray(raw.reviews).length
    : Number(raw.rating || owner.rating || 0);

  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    category: raw.category || 'other',
    condition: String(raw.condition || 'good').toLowerCase(),
    pricePerDay: Number(raw.pricePerDay || 0),
    images: imageCandidates.length
      ? imageCandidates
      : [LISTING_PLACEHOLDER_IMAGE],
    ownerId: raw.ownerId || owner.id,
    owner,
    status: availability.status,
    availabilityLabel: availability.availabilityLabel,
    nextAvailableDate: availability.nextAvailableDate,
    pickupLocation: raw.location || raw.pickupLocation || 'On Campus',
    location: raw.location || raw.pickupLocation || 'On Campus',
    rating: Number.isFinite(avgRating) ? Number(avgRating) : 0,
    reviewCount,
    featured: Boolean(raw.featured),
    blockedDates: availability.blockedDates,
  };
}

export function toReview(raw: AnyObj = {}): AnyObj {
  const reviewer = toUser(raw.reviewer || raw.user || {});
  return {
    id: raw.id,
    listingId: raw.listingId,
    userId: raw.reviewerId || raw.userId || reviewer.id,
    user: reviewer,
    reviewer,
    rating: Number(raw.rating || 0),
    comment: raw.comment || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    listing: raw.listing,
  };
}

function mapBookingStatus(status: string) {
  if (status === 'accepted') return 'active';
  if (status === 'rejected') return 'cancelled';
  return status || 'pending';
}

export function toBooking(raw: AnyObj = {}): AnyObj {
  const listing = toListing(raw.listing || {});
  const renter = toUser(raw.renter || {});

  return {
    id: raw.id,
    listingId: raw.listingId || listing.id,
    listing,
    renterId: raw.renterId || renter.id,
    renter,
    startDate: raw.startDate,
    endDate: raw.endDate,
    totalPrice: Number(raw.totalCost || raw.totalPrice || 0),
    totalCost: Number(raw.totalCost || raw.totalPrice || 0),
    status: mapBookingStatus(raw.status),
    daysRemaining: typeof raw.daysRemaining === 'number' ? raw.daysRemaining : null,
    isOverdue: Boolean(raw.isOverdue),
    lifecycleStatus: raw.lifecycleStatus || raw.status,
    extensionStatus: raw.extensionStatus || 'none',
    extensionRequestedEndDate: raw.extensionRequestedEndDate || null,
    extensionRequestedAt: raw.extensionRequestedAt || null,
    extensionResolvedAt: raw.extensionResolvedAt || null,
    lateFeePerDay: Number(raw.lateFeePerDay || 0),
    lateFeeAccrued: Number(raw.lateFeeAccrued || 0),
    potentialLateFee: Number(raw.potentialLateFee || raw.lateFeeAccrued || 0),
    reminderSentAt: raw.reminderSentAt || null,
    paymentStatus: raw.paymentStatus || null,
    statusEvents: safeArray(raw.statusEvents).map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus ?? null,
      toStatus: event.toStatus,
      action: event.action,
      actorId: event.actorId ?? null,
      metadata: event.metadata ?? null,
      createdAt: event.createdAt,
    })),
    createdAt: raw.createdAt,
  };
}

export function toConversation(raw: AnyObj = {}, currentUserId?: string): AnyObj {
  const listing = toListing(raw.listing || {});
  const otherUser = toUser(raw.otherUser || {});
  const conversationId = raw.conversationId || raw.id;

  return {
    id: conversationId,
    conversationId,
    listingId: raw.listingId || listing.id,
    listing,
    participants: [toUser({ id: currentUserId || 'me', name: 'You' }), otherUser],
    otherUser,
    unreadCount: Number(raw.unreadCount || 0),
    lastMessage: {
      id: raw?.lastMessage?.id,
      content: raw?.lastMessage?.content || '',
      senderId: raw?.lastMessage?.senderId,
      timestamp: raw?.lastMessage?.createdAt || raw?.lastMessage?.timestamp || raw.updatedAt,
    },
  };
}

export function toMessage(raw: AnyObj = {}): AnyObj {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    content: raw.content || '',
    timestamp: raw.createdAt || raw.timestamp || new Date().toISOString(),
    sender: raw.sender ? toUser(raw.sender) : null,
    isSystem: Boolean(raw.isSystem),
  };
}
