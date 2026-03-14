export type ListingStatus = "available" | "rented" | "pending";
export type BookingStatus = "pending" | "active" | "completed" | "cancelled";
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
