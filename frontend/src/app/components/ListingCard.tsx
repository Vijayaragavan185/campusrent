import { Star, MapPin } from "lucide-react";
import { Link } from "react-router";
import { Listing } from "../types";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const statusColors = {
    available: "bg-[#27AE60] text-white",
    rented: "bg-[#4B5563] text-white",
    pending: "bg-[#F4A623] text-white"
  };

  const badgeLabel = listing.availabilityLabel || listing.status;
  const badgeColorClass = listing.status === 'rented' ? statusColors.rented : statusColors.available;
  const nextDateLabel = listing.nextAvailableDate
    ? new Date(listing.nextAvailableDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <Link to={`/listing/${listing.id}`}>
      <div className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${listing.featured ? 'ring-2 ring-[#F4A623]' : ''}`}>
        <div className="relative aspect-[4/3]">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs ${badgeColorClass}`}>
              {badgeLabel}
            </span>
          </div>
          {listing.featured && (
            <div className="absolute top-3 left-3 bg-[#F4A623] text-white px-3 py-1 rounded-full text-xs">
              Featured
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-[#111827] mb-1 line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>
            {listing.title}
          </h3>
          
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 text-[#F4A623] fill-[#F4A623]" />
            <span className="text-sm text-[#111827]">
              {listing.rating.toFixed(1)}
            </span>
            <span className="text-sm text-[#4B5563]">
              ({listing.reviewCount})
            </span>
          </div>
          
          <div className="flex items-center gap-1 mb-3 text-sm text-[#4B5563]">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{listing.pickupLocation}</span>
          </div>

          {listing.status === 'rented' && nextDateLabel && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-[#4B5563]/10 text-[#4B5563]">
                Next available: {nextDateLabel}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#2D6BE4]" style={{ fontFamily: 'var(--font-display)' }}>
                ${listing.pricePerDay}
              </span>
              <span className="text-sm text-[#4B5563]">/day</span>
            </div>
            
            <div className="flex items-center gap-2">
              <img
                src={listing.owner.avatar}
                alt={listing.owner.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              {listing.owner.verified && (
                <div className="w-5 h-5 bg-[#2D6BE4] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
