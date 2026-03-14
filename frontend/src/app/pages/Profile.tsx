import { useParams, Link } from "react-router";
import { Star, MapPin, Calendar, Settings as SettingsIcon, CheckCircle } from "lucide-react";
import { mockUsers, mockListings, mockReviews } from "../data/mockData";

export default function Profile() {
  const { id } = useParams();
  const user = mockUsers.find(u => u.id === id);
  const userListings = mockListings.filter(l => l.ownerId === id);
  const userReviews = mockReviews.filter(r => r.userId === id);
  
  const isOwnProfile = id === "1";

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Cover + Avatar */}
          <div className="relative mb-16">
            <div className="h-32 bg-gradient-to-r from-[#2D6BE4] to-[#1e4fad] rounded-2xl" />
            <div className="absolute -bottom-16 left-0 flex items-end gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    {user.name}
                  </h1>
                  {user.verified && (
                    <div className="w-6 h-6 bg-[#2D6BE4] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>
                <p className="text-[#4B5563]">{user.department}</p>
              </div>
            </div>
            
            {isOwnProfile && (
              <Link
                to="/settings"
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              >
                <SettingsIcon className="w-5 h-5 text-[#4B5563]" />
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-[#F3F4F6] rounded-xl">
              <div className="text-2xl text-[#111827] mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                {user.itemsListed}
              </div>
              <div className="text-sm text-[#4B5563]">Items Listed</div>
            </div>
            <div className="text-center p-4 bg-[#F3F4F6] rounded-xl">
              <div className="text-2xl text-[#111827] mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                {user.totalRentals}
              </div>
              <div className="text-sm text-[#4B5563]">Total Rentals</div>
            </div>
            <div className="text-center p-4 bg-[#F3F4F6] rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 text-[#F4A623] fill-[#F4A623]" />
                <span className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {user.rating.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-[#4B5563]">Rating</div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-[#4B5563]">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Member since {user.memberSince}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>On Campus</span>
            </div>
          </div>
        </div>
      </header>

      {/* Listings */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <section className="mb-8">
          <h2 className="text-2xl text-[#111827] mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Listings ({userListings.length})
          </h2>
          
          {userListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userListings.map((listing) => (
                <Link key={listing.id} to={`/listing/${listing.id}`}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-[4/3]">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg text-[#111827] mb-2 line-clamp-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        {listing.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#F4A623] fill-[#F4A623]" />
                          <span className="text-sm">{listing.rating.toFixed(1)}</span>
                        </div>
                        <div className="text-lg text-[#2D6BE4]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                          ${listing.pricePerDay}/day
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-[#4B5563]">No listings yet</p>
            </div>
          )}
        </section>

        {/* Reviews */}
        {userReviews.length > 0 && (
          <section>
            <h2 className="text-2xl text-[#111827] mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Reviews as Renter ({userReviews.length})
            </h2>
            
            <div className="space-y-4">
              {userReviews.map((review) => {
                const listing = mockListings.find(l => l.id === review.listingId);
                return (
                  <div key={review.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {listing && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <Link to={`/listing/${review.listingId}`} className="text-[#111827] hover:text-[#2D6BE4]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                          {listing?.title}
                        </Link>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "text-[#F4A623] fill-[#F4A623]" : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-[#4B5563] ml-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#4B5563]">{review.comment}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
