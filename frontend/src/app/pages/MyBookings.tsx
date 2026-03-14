import { useState } from "react";
import { Link } from "react-router";
import { Calendar, Star } from "lucide-react";
import { mockBookings } from "../data/mockData";

type TabType = "renting" | "lending";

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<TabType>("renting");

  const rentingBookings = mockBookings;
  const lendingBookings: typeof mockBookings = [];

  const bookings = activeTab === "renting" ? rentingBookings : lendingBookings;

  const statusColors = {
    pending: "bg-[#F4A623] text-white",
    active: "bg-[#27AE60] text-white",
    completed: "bg-[#4B5563] text-white",
    cancelled: "bg-[#E74C3C] text-white"
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
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
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
                        <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-[#4B5563] mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={booking.listing.owner.avatar}
                            alt={booking.listing.owner.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-[#4B5563]">
                            {booking.listing.owner.name}
                          </span>
                        </div>
                        
                        <div className="text-lg text-[#2D6BE4]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                          ${booking.totalPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {booking.status === "completed" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full py-2 border-2 border-[#F4A623] text-[#F4A623] rounded-lg hover:bg-[#F4A623] hover:text-white transition-colors flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
                      Leave a Review
                    </button>
                  </div>
                )}
              </div>
            ))}
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
                : "List your first item to start earning"}
            </p>
            <Link
              to={activeTab === "renting" ? "/home" : "/post"}
              className="inline-block px-6 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
            >
              {activeTab === "renting" ? "Browse Listings" : "Post a Listing"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
