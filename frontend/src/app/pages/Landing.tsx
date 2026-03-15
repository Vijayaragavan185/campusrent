import { ArrowRight, CheckCircle, Shield, Clock, MapPin } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Verified Users",
      description: "All members verified with university email"
    },
    {
      icon: Clock,
      title: "Easy Booking",
      description: "Simple rental process, instant confirmation"
    },
    {
      icon: MapPin,
      title: "Campus Pickup",
      description: "Meet on campus for safe exchanges"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F3F4F6]">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#2D6BE4] rounded-xl flex items-center justify-center">
            <span className="text-white text-xl" style={{ fontFamily: 'var(--font-display)' }}>CR</span>
          </div>
          <span className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            CampusRent
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-6 py-2 border border-[#2D6BE4] text-[#2D6BE4] rounded-lg hover:bg-[#2D6BE4]/5 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2 bg-[#2D6BE4] text-white rounded-lg hover:bg-[#2557b8] transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl mb-6 text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Rent from people you trust —{" "}
              <span className="text-[#2D6BE4]">your campus community</span>
            </h1>
            <p className="text-lg text-[#4B5563] mb-8">
              Need a camera for a project? Camping gear for the weekend? CampusRent connects you with fellow students who have what you need.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/home"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors text-lg"
              >
                Browse Listings
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#2D6BE4] text-[#2D6BE4] rounded-xl hover:bg-[#2D6BE4] hover:text-white transition-colors text-lg"
              >
                Get Started
              </Link>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-[#4B5563]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#27AE60]" />
                <span>Free to join</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#27AE60]" />
                <span>Verified community</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <ImageWithFallback
              src="https://images.unsplash.com/flagged/photo-1580408453889-ed5e1b51924a?w=800"
              alt="University campus"
              className="rounded-2xl shadow-2xl w-full"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#27AE60] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>500+</div>
                  <div className="text-sm text-[#4B5563]">Active Listings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="text-3xl md:text-4xl text-center mb-12 text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Why CampusRent?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#2D6BE4]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-[#2D6BE4]" />
                </div>
                <h3 className="text-xl mb-3 text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="text-[#4B5563]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 max-w-4xl mb-16">
        <div className="bg-gradient-to-r from-[#2D6BE4] to-[#1e4fad] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Ready to get started?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join your campus community and start renting today
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#2D6BE4] rounded-xl hover:bg-gray-100 transition-colors text-lg"
          >
            Sign Up with University Email
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
