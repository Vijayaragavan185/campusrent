import { Listing, User, Booking, Review, Conversation, Message } from "../types";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.j@university.edu",
    avatar: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=200",
    department: "Computer Science",
    yearOfStudy: "Junior",
    verified: true,
    rating: 4.8,
    totalRentals: 23,
    itemsListed: 5,
    memberSince: "January 2025"
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "s.chen@university.edu",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    department: "Photography",
    yearOfStudy: "Senior",
    verified: true,
    rating: 5.0,
    totalRentals: 45,
    itemsListed: 8,
    memberSince: "September 2023"
  },
  {
    id: "3",
    name: "Mike Williams",
    email: "m.williams@university.edu",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    department: "Engineering",
    yearOfStudy: "Sophomore",
    verified: true,
    rating: 4.5,
    totalRentals: 12,
    itemsListed: 3,
    memberSince: "August 2024"
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "e.davis@university.edu",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    department: "Music",
    yearOfStudy: "Graduate",
    verified: true,
    rating: 4.9,
    totalRentals: 31,
    itemsListed: 4,
    memberSince: "March 2024"
  },
  {
    id: "5",
    name: "James Martinez",
    email: "j.martinez@university.edu",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    department: "Business",
    yearOfStudy: "Senior",
    verified: true,
    rating: 4.7,
    totalRentals: 18,
    itemsListed: 6,
    memberSince: "January 2024"
  }
];

export const mockListings: Listing[] = [
  {
    id: "1",
    title: "Canon EOS R6 Camera Kit",
    description: "Professional mirrorless camera with 24-105mm lens. Perfect for photography projects and events. Includes battery, charger, and SD card.",
    category: "electronics",
    condition: "good",
    pricePerDay: 45,
    images: [
      "https://images.unsplash.com/photo-1751107996128-6a85dae2a7e0?w=800",
      "https://images.unsplash.com/photo-1760144168213-b554be6859b1?w=800"
    ],
    ownerId: "2",
    owner: mockUsers[1],
    status: "available",
    pickupLocation: "Main Library, 2nd Floor",
    rating: 5.0,
    reviewCount: 8,
    featured: true
  },
  {
    id: "2",
    title: "Calculus Textbook Bundle",
    description: "Complete set of calculus textbooks for Math 201 and 202. Excellent condition with minimal highlighting.",
    category: "books",
    condition: "good",
    pricePerDay: 5,
    images: ["https://images.unsplash.com/photo-1633707392225-d883c8cd3e99?w=800"],
    ownerId: "1",
    owner: mockUsers[0],
    status: "available",
    pickupLocation: "Student Center",
    rating: 4.5,
    reviewCount: 3
  },
  {
    id: "3",
    title: "Electric Bike",
    description: "Fast and eco-friendly e-bike for campus commuting. 40-mile range, includes helmet and lock.",
    category: "sports",
    condition: "good",
    pricePerDay: 25,
    images: ["https://images.unsplash.com/photo-1758764032776-08f6930a9146?w=800"],
    ownerId: "3",
    owner: mockUsers[2],
    status: "available",
    pickupLocation: "South Campus Parking",
    rating: 4.8,
    reviewCount: 12
  },
  {
    id: "4",
    title: "Power Drill Set",
    description: "Professional cordless drill with bits and carrying case. Great for DIY projects and furniture assembly.",
    category: "tools",
    condition: "good",
    pricePerDay: 15,
    images: ["https://images.unsplash.com/photo-1755168648692-ef8937b7e63e?w=800"],
    ownerId: "3",
    owner: mockUsers[2],
    status: "available",
    pickupLocation: "Engineering Building",
    rating: 4.7,
    reviewCount: 5
  },
  {
    id: "5",
    title: "4-Person Camping Tent",
    description: "Spacious tent perfect for weekend camping trips. Waterproof and easy to set up. Includes stakes and carrying bag.",
    category: "sports",
    condition: "good",
    pricePerDay: 20,
    images: ["https://images.unsplash.com/photo-1759478438444-fe6a86aea855?w=800"],
    ownerId: "5",
    owner: mockUsers[4],
    status: "available",
    pickupLocation: "Outdoor Recreation Center",
    rating: 4.9,
    reviewCount: 7,
    featured: true
  },
  {
    id: "6",
    title: "MacBook Pro 16\"",
    description: "M1 Pro MacBook with 16GB RAM. Perfect for video editing and heavy computing tasks. Includes charger.",
    category: "electronics",
    condition: "good",
    pricePerDay: 35,
    images: ["https://images.unsplash.com/photo-1658674432235-498decd2e7fd?w=800"],
    ownerId: "1",
    owner: mockUsers[0],
    status: "rented",
    pickupLocation: "Computer Science Building",
    rating: 5.0,
    reviewCount: 6
  },
  {
    id: "7",
    title: "Professional Skateboard",
    description: "High-quality skateboard with new wheels and bearings. Great for beginners and intermediate riders.",
    category: "sports",
    condition: "good",
    pricePerDay: 10,
    images: ["https://images.unsplash.com/photo-1738666829856-f80b7079a057?w=800"],
    ownerId: "3",
    owner: mockUsers[2],
    status: "available",
    pickupLocation: "Student Rec Center",
    rating: 4.6,
    reviewCount: 4
  },
  {
    id: "8",
    title: "Acoustic Guitar",
    description: "Beautiful Yamaha acoustic guitar in excellent condition. Comes with case, tuner, and extra strings.",
    category: "other",
    condition: "good",
    pricePerDay: 18,
    images: ["https://images.unsplash.com/photo-1628887067605-5171efd812e3?w=800"],
    ownerId: "4",
    owner: mockUsers[3],
    status: "available",
    pickupLocation: "Music Building, Room 101",
    rating: 5.0,
    reviewCount: 9,
    featured: true
  },
  {
    id: "9",
    title: "HD Projector",
    description: "1080p projector perfect for presentations and movie nights. Includes HDMI cable and remote.",
    category: "electronics",
    condition: "good",
    pricePerDay: 30,
    images: ["https://images.unsplash.com/photo-1761388559873-40bfb05f39e8?w=800"],
    ownerId: "5",
    owner: mockUsers[4],
    status: "available",
    pickupLocation: "Business School",
    rating: 4.8,
    reviewCount: 6
  },
  {
    id: "10",
    title: "Studio Microphone",
    description: "Professional USB microphone for podcasting, streaming, and voice recording. Crystal clear audio quality.",
    category: "electronics",
    condition: "new",
    pricePerDay: 20,
    images: ["https://images.unsplash.com/photo-1772399764232-c35bac262ed6?w=800"],
    ownerId: "2",
    owner: mockUsers[1],
    status: "available",
    pickupLocation: "Media Lab",
    rating: 4.9,
    reviewCount: 5
  },
  {
    id: "11",
    title: "Tennis Racket & Balls",
    description: "Wilson tennis racket with a set of new balls. Perfect for casual games or practice sessions.",
    category: "sports",
    condition: "good",
    pricePerDay: 8,
    images: ["https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800"],
    ownerId: "3",
    owner: mockUsers[2],
    status: "available",
    pickupLocation: "Tennis Courts",
    rating: 4.5,
    reviewCount: 3
  },
  {
    id: "12",
    title: "Photo Studio Lighting Kit",
    description: "Professional 3-light setup with softboxes and stands. Ideal for portrait photography and product shots.",
    category: "electronics",
    condition: "good",
    pricePerDay: 40,
    images: ["https://images.unsplash.com/photo-1745848038063-bbb6fc8c8867?w=800"],
    ownerId: "2",
    owner: mockUsers[1],
    status: "available",
    pickupLocation: "Photography Studio",
    rating: 5.0,
    reviewCount: 7
  },
  {
    id: "13",
    title: "Hiking Backpack 65L",
    description: "Large capacity backpack perfect for multi-day hiking trips. Features hydration system compatibility.",
    category: "sports",
    condition: "good",
    pricePerDay: 12,
    images: ["https://images.unsplash.com/photo-1771849316197-2b1f3f49b651?w=800"],
    ownerId: "5",
    owner: mockUsers[4],
    status: "available",
    pickupLocation: "Outdoor Recreation Center",
    rating: 4.7,
    reviewCount: 4
  }
];

export const mockReviews: Review[] = [
  {
    id: "1",
    listingId: "1",
    userId: "1",
    user: mockUsers[0],
    rating: 5,
    comment: "Amazing camera! Sarah was super helpful and the equipment was in perfect condition.",
    createdAt: "2026-03-05T10:30:00Z"
  },
  {
    id: "2",
    listingId: "1",
    userId: "3",
    user: mockUsers[2],
    rating: 5,
    comment: "Great rental experience. The camera worked flawlessly for my project.",
    createdAt: "2026-02-28T14:20:00Z"
  },
  {
    id: "3",
    listingId: "3",
    userId: "1",
    user: mockUsers[0],
    rating: 5,
    comment: "Perfect for getting around campus! Saved me so much time.",
    createdAt: "2026-03-01T09:15:00Z"
  }
];

export const mockBookings: Booking[] = [
  {
    id: "1",
    listingId: "1",
    listing: mockListings[0],
    renterId: "1",
    renter: mockUsers[0],
    startDate: "2026-03-15",
    endDate: "2026-03-17",
    totalPrice: 135,
    status: "pending",
    createdAt: "2026-03-11T10:00:00Z"
  },
  {
    id: "2",
    listingId: "3",
    listing: mockListings[2],
    renterId: "1",
    renter: mockUsers[0],
    startDate: "2026-03-10",
    endDate: "2026-03-12",
    totalPrice: 75,
    status: "active",
    createdAt: "2026-03-09T15:30:00Z"
  }
];

const mockMessage1: Message = {
  id: "1",
  conversationId: "1",
  senderId: "1",
  content: "Hi! Is the camera still available for March 15-17?",
  timestamp: "2026-03-11T10:05:00Z"
};

const mockMessage2: Message = {
  id: "2",
  conversationId: "1",
  senderId: "2",
  content: "Yes, it's available! I can meet you at the library for pickup.",
  timestamp: "2026-03-11T10:15:00Z"
};

export const mockConversations: Conversation[] = [
  {
    id: "1",
    listingId: "1",
    listing: mockListings[0],
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: mockMessage2,
    unreadCount: 0
  }
];
