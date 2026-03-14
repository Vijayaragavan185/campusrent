import { Search as SearchIcon } from "lucide-react";
import { Link } from "react-router";
import { mockListings } from "../data/mockData";
import ListingCard from "../components/ListingCard";

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
  const featuredListings = mockListings.filter(l => l.featured);
  const nearbyListings = mockListings.filter(l => !l.featured).slice(0, 6);

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
            <Link to="/profile/1">
              <img
                src="https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=200"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>
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
        </section>
      </main>
    </div>
  );
}
