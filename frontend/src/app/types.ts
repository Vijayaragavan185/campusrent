export type ListingStatus = "available" | "rented" | "pending";
export type BookingStatus = "pending" | "active" | "requested_return" | "returned" | "completed" | "cancelled";
export type Category = "all" | "electronics" | "books" | "clothing" | "sports" | "tools" | "other";
export type Condition = "new" | "good" | "fair";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  yearOfStudy: string;
  verified: boolean;
  rating: number;
  totalRentals: number;
  itemsListed: number;
  memberSince: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  pricePerDay: number;
  images: string[];
  ownerId: string;
  owner: User;
  status: ListingStatus;
  pickupLocation: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  blockedDates?: string[];
  nextAvailableDate?: string | null;
  availabilityLabel?: string;
}

export interface Booking {
  id: string;
  listingId: string;
  listing: Listing;
  renterId: string;
  renter: User;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  daysRemaining?: number | null;
  isOverdue?: boolean;
  lifecycleStatus?: string;
  extensionStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  extensionRequestedEndDate?: string | null;
  extensionRequestedAt?: string | null;
  extensionResolvedAt?: string | null;
  lateFeePerDay?: number;
  lateFeeAccrued?: number;
  potentialLateFee?: number;
  reminderSentAt?: string | null;
  statusEvents?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    action: string;
    actorId?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  user: User;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Conversation {
  id: string;
  listingId: string;
  listing: Listing;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}
