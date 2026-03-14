import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Send } from "lucide-react";
import { mockConversations } from "../data/mockData";

export default function Chat() {
  const { id } = useParams();
  const conversation = mockConversations.find(c => c.id === id);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: "1",
      content: "Hi! Is the camera still available for March 15-17?",
      timestamp: "2026-03-11T10:05:00Z",
      isSystem: false
    },
    {
      id: "2",
      senderId: "2",
      content: "Yes, it's available! I can meet you at the library for pickup.",
      timestamp: "2026-03-11T10:15:00Z",
      isSystem: false
    },
    {
      id: "3",
      senderId: "system",
      content: "Booking request sent",
      timestamp: "2026-03-11T10:20:00Z",
      isSystem: true
    }
  ]);

  if (!conversation) {
    return <div>Conversation not found</div>;
  }

  const otherUser = conversation.participants[1];
  const currentUserId = "1";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: message,
      timestamp: new Date().toISOString(),
      isSystem: false
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link to="/inbox" className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D6BE4] transition-colors mb-3">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          
          <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-3">
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="text-lg text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {otherUser.name}
              </div>
              <div className="text-sm text-[#4B5563]">
                {otherUser.department}
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Listing Context Card */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <Link to={`/listing/${conversation.listing.id}`}>
            <div className="flex items-center gap-3 p-3 bg-[#F3F4F6] rounded-xl hover:bg-[#e5e7eb] transition-colors">
              <img
                src={conversation.listing.images[0]}
                alt={conversation.listing.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[#111827] line-clamp-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {conversation.listing.title}
                </div>
                <div className="text-sm text-[#2D6BE4]">
                  ${conversation.listing.pricePerDay}/day
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
          {messages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="px-4 py-2 bg-[#F3F4F6] text-[#4B5563] text-sm rounded-full">
                    {msg.content}
                  </div>
                </div>
              );
            }

            const isOwn = msg.senderId === currentUserId;
            const showTimestamp = index === 0 || 
              new Date(msg.timestamp).getDate() !== new Date(messages[index - 1].timestamp).getDate();

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <div className="flex justify-center mb-4">
                    <span className="text-xs text-[#4B5563]">
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      isOwn
                        ? "bg-[#2D6BE4] text-white rounded-br-none"
                        : "bg-white text-[#111827] rounded-bl-none"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-[#4B5563]"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-[#F3F4F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="p-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors disabled:opacity-50"
              disabled={!message.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
