import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { listingsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const categories = ["electronics", "books", "clothing", "sports", "tools", "other"];
const conditions = ["new", "good", "fair"];

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

export default function PostListing() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && images.length < 5) {
      try {
        const fileList = Array.from(files).slice(0, 5 - images.length);
        const newImages = await Promise.all(fileList.map(readFileAsDataUrl));
        setImages([...images, ...newImages]);
      } catch (error) {
        toast.error("Failed to process selected image(s)");
      }
    }

    // allow re-selecting the same file again later
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?.id) {
      toast.error("Please sign in to post a listing");
      navigate('/login');
      return;
    }
    
    if (!title || !category || !condition || !description || !price || !location) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await listingsAPI.create({
        title,
        category,
        condition,
        description,
        pricePerDay: Number(price),
        location,
        images,
      });

      toast.success("Listing posted successfully!");
      navigate(`/listing/${res.data.id}`);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to post listing';
      toast.error(message);
    }
  };

  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link to="/home" className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D6BE4] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-3xl text-[#111827] mb-6" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Post a Listing
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6">
          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-[#111827] mb-3">
              Photos (up to 5)
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-[#E74C3C] text-white rounded-full hover:bg-[#c0392b]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#2D6BE4] hover:bg-[#2D6BE4]/5 transition-colors">
                  <Upload className="w-8 h-8 text-[#4B5563] mb-2" />
                  <span className="text-sm text-[#4B5563]">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-[#111827] mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Canon EOS R6 Camera Kit"
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Category and Condition */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="category" className="block text-[#111827] mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-[#111827] mb-2">
                Condition
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
                required
              >
                <option value="">Select condition</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond} className="capitalize">
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-[#111827] mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item in detail..."
              rows={4}
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none resize-none"
              required
            />
          </div>

          {/* Price */}
          <div className="mb-6">
            <label htmlFor="price" className="block text-[#111827] mb-2">
              Price per day ($)
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="25"
              min="1"
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              required
            />
            <p className="text-sm text-[#4B5563] mt-1">Suggested: $20-$30 for similar items</p>
          </div>

          {/* Pickup Location */}
          <div className="mb-6">
            <label htmlFor="location" className="block text-[#111827] mb-2">
              Pickup/Return Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Library, 2nd Floor"
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
          >
            Post Listing
          </button>
        </form>
      </main>
    </div>
  );
}
