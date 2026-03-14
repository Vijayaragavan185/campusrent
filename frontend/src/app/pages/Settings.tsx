import { Link } from "react-router";
import { ArrowLeft, User, Bell, Lock, CreditCard, HelpCircle, LogOut } from "lucide-react";

export default function Settings() {
  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", description: "Update your personal information" },
        { icon: Bell, label: "Notifications", description: "Manage your notification preferences" },
        { icon: Lock, label: "Privacy & Security", description: "Control your privacy settings" }
      ]
    },
    {
      title: "Payment",
      items: [
        { icon: CreditCard, label: "Payment Methods", description: "Manage your payment options" }
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help & Support", description: "Get help or contact support" }
      ]
    }
  ];

  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link to="/profile/1" className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D6BE4] transition-colors mb-3">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Settings
          </h1>
        </div>
      </header>

      {/* Settings List */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-lg text-[#111827] mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {section.title}
            </h2>
            <div className="bg-white rounded-xl overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#F3F4F6] transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-[#2D6BE4]/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#2D6BE4]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        {item.label}
                      </div>
                      <div className="text-sm text-[#4B5563]">{item.description}</div>
                    </div>
                    <svg className="w-5 h-5 text-[#4B5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <div className="bg-white rounded-xl">
          <Link to="/">
            <button className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors">
              <div className="w-10 h-10 bg-[#E74C3C]/10 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-[#E74C3C]" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[#E74C3C]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  Sign Out
                </div>
              </div>
            </button>
          </Link>
        </div>

        {/* App Info */}
        <div className="text-center mt-8 text-sm text-[#4B5563]">
          <p>CampusRent v1.0.0</p>
          <p className="mt-1">© 2026 CampusRent. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
