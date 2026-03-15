// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { listingsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const categories = ["electronics", "books", "clothing", "sports", "tools", "other"];
const conditions = ["new", "good", "fair"];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        toast.error("Invalid listing id");
        navigate('/home');
        return;
      }

      if (!currentUser?.id) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const res = await listingsAPI.getOne(id);
        const raw = res.data || {};

        if (raw.ownerId !== currentUser.id) {
          toast.error("You can edit only your own listings");
          navigate(`/listing/${id}`);
          return;
        }

        setTitle(raw.title || "");
        setCategory(raw.category || "");
        setCondition(String(raw.condition || "").toLowerCase());
        setDescription(raw.description || "");
        setPrice(String(raw.pricePerDay || ""));
        setLocation(raw.location || "");
        setImages(
          Array.isArray(raw.images)
              ? raw.images.filter((img) => typeof img === 'string' && img && !img.startsWith('blob:'))
            : []
        );
      } catch (error) {
        console.error('Failed to load listing for edit', error);
        toast.error('Could not load listing');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, currentUser?.id, navigate]);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (files && images.length < 5) {
      try {
        const fileList = Array.from(files).slice(0, 5 - images.length);
        const newImages = await Promise.all(fileList.map(readFileAsDataUrl));
        setImages((prev) => [...prev, ...newImages]);
      } catch {
        toast.error("Failed to process selected image(s)");
      }
    }

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id) return;

    if (!title || !category || !condition || !description || !price || !location) {
      toast.error("Please fill in all fields");
      return;
    }

    if (images.length === 0) {
      toast.error("Please keep at least one image");
      return;
    }

    try {
      setSaving(true);
      await listingsAPI.update(id, {
        title,
        category,
        condition,
        description,
        pricePerDay: Number(price),
        location,
        images,
      });

      toast.success("Listing updated successfully!");
      navigate(`/listing/${id}`);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to update listing';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading listing editor...</div>;
  }

  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link to={id ? `/listing/${id}` : '/home'} className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D6BE4] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-3xl text-[#111827] mb-6" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Edit Listing
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <label className="block text-[#111827] mb-3">Photos (up to 5)</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img src={img} alt={`Listing ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
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

          <div className="mb-6">
            <label htmlFor="title" className="block text-[#111827] mb-2">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="category" className="block text-[#111827] mb-2">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-[#111827] mb-2">Condition</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
                required
              >
                <option value="">Select condition</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond} className="capitalize">{cond}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-[#111827] mb-2">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none resize-none"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="price" className="block text-[#111827] mb-2">Price per day ($)</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="1"
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="location" className="block text-[#111827] mb-2">Pickup/Return Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}
