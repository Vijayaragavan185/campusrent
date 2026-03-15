import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import ListingCard from "../components/ListingCard";
import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import { listingsAPI } from "../../services/api";
import { toListing } from "../../services/normalizers";

const categories = [
  { id: "all", label: "All" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "clothing", label: "Clothing" },
  { id: "sports", label: "Sports" },
  { id: "tools", label: "Tools" },
  { id: "other", label: "Other" }
];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedNextAvailableDate, setSelectedNextAvailableDate] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const nextAvailableChips = useMemo(() => {
    const labelToDateKey = new Map<string, string>();
    filteredListings.forEach((listing) => {
      if (!listing?.nextAvailableDate) return;
      const date = new Date(listing.nextAvailableDate);
      if (Number.isNaN(date.getTime())) return;
      const dateKey = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!labelToDateKey.has(label)) {
        labelToDateKey.set(label, dateKey);
      }
    });

    return Array.from(labelToDateKey.entries())
      .slice(0, 4)
      .map(([label, dateKey]) => ({ label, dateKey }));
  }, [filteredListings]);

  const visibleListings = useMemo(() => {
    if (!selectedNextAvailableDate) return filteredListings;
    return filteredListings.filter((listing) => {
      if (!listing?.nextAvailableDate) return false;
      const date = new Date(listing.nextAvailableDate);
      if (Number.isNaN(date.getTime())) return false;
      return date.toISOString().slice(0, 10) === selectedNextAvailableDate;
    });
  }, [filteredListings, selectedNextAvailableDate]);

  useEffect(() => {
    let isCancelled = false;

    const runSearch = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          q: searchQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
        };

        const res = await listingsAPI.search(params);
        if (!isCancelled) {
          setFilteredListings((res.data || []).map(toListing));
        }
      } catch (error) {
        console.error('Search failed', error);
        if (!isCancelled) setFilteredListings([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const timeout = setTimeout(runSearch, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [searchQuery, selectedCategory, priceRange]);

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for items..."
                className="w-full pl-12 pr-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="p-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== "all" || priceRange[0] > 0 || priceRange[1] < 100 || selectedNextAvailableDate) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedCategory !== "all" && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#2D6BE4]/10 text-[#2D6BE4] rounded-full text-sm">
                  {categories.find(c => c.id === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory("all")}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 100) && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#2D6BE4]/10 text-[#2D6BE4] rounded-full text-sm">
                  ${priceRange[0]} - ${priceRange[1]}
                  <button onClick={() => setPriceRange([0, 100])}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedNextAvailableDate && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#4B5563]/10 text-[#4B5563] rounded-full text-sm">
                  Next available: {new Date(selectedNextAvailableDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  <button onClick={() => setSelectedNextAvailableDate(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-4">
          <p className="text-[#4B5563]">
            {loading ? 'Searching... ' : ''}
            {visibleListings.length} {visibleListings.length === 1 ? "result" : "results"} found
          </p>

          {nextAvailableChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-[#4B5563] self-center">Next available:</span>
              {nextAvailableChips.map((chip) => (
                <button
                  key={chip.dateKey}
                  type="button"
                  onClick={() => setSelectedNextAvailableDate((prev) => prev === chip.dateKey ? null : chip.dateKey)}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] transition-colors ${
                    selectedNextAvailableDate === chip.dateKey
                      ? 'bg-[#4B5563] text-white'
                      : 'bg-[#4B5563]/10 text-[#4B5563] hover:bg-[#4B5563]/20'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {visibleListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-10 h-10 text-[#4B5563]" />
            </div>
            <h3 className="text-xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              No results found
            </h3>
            <p className="text-[#4B5563]">Try adjusting your filters or search query</p>
          </div>
        )}
      </main>

      {/* Filter Dialog */}
      <Dialog.Root open={filterOpen} onOpenChange={setFilterOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Filters
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Adjust category and price range filters to refine listing search results.
              </Dialog.Description>
              <Dialog.Close className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[#4B5563]" />
              </Dialog.Close>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-lg text-[#111827] mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      selectedCategory === category.id
                        ? "bg-[#2D6BE4] text-white"
                        : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#2D6BE4]/10"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="text-lg text-[#111827] mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                Price Range (per day)
              </h3>
              <div className="mb-4">
                <Slider.Root
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100}
                  step={5}
                  className="relative flex items-center w-full h-5"
                >
                  <Slider.Track className="relative bg-[#F3F4F6] rounded-full h-2 flex-grow">
                    <Slider.Range className="absolute bg-[#2D6BE4] rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-[#2D6BE4] rounded-full hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2D6BE4]" />
                  <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-[#2D6BE4] rounded-full hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2D6BE4]" />
                </Slider.Root>
              </div>
              <div className="flex items-center justify-between text-sm text-[#4B5563]">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => setFilterOpen(false)}
              className="w-full py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
            >
              Apply Filters
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
