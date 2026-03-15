import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { messagesAPI } from "../../services/api";
import { listingsAPI, usersAPI } from "../../services/api";
import { toConversation, toListing, toMessage, toUser } from "../../services/normalizers";
import { useAuthStore } from "../../store/authStore";

function parseConversationId(conversationId: string) {
  const parts = conversationId.split('_');
  if (parts.length < 3) return null;
  const firstUserId = parts[0];
  const secondUserId = parts[1];
  const listingId = parts.slice(2).join('_');
  return { firstUserId, secondUserId, listingId };
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      if (!currentUser?.id) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const [messagesRes, conversationsRes] = await Promise.all([
          messagesAPI.getMessages(id),
          messagesAPI.getConversations(),
        ]);

        setMessages((messagesRes.data || []).map(toMessage));
        const matched = (conversationsRes.data || []).find((c: any) => (c.id || c.conversationId) === id);

        if (matched) {
          setConversation(toConversation(matched, currentUser.id));
        } else {
          const parsed = parseConversationId(id);
          if (!parsed) {
            setConversation(null);
            return;
          }

          const otherUserId = parsed.firstUserId === currentUser.id ? parsed.secondUserId : parsed.firstUserId;

          const [listingRes, otherUserRes] = await Promise.all([
            listingsAPI.getOne(parsed.listingId),
            usersAPI.getProfile(otherUserId),
          ]);

          setConversation({
            id,
            conversationId: id,
            listingId: parsed.listingId,
            listing: toListing(listingRes.data || {}),
            otherUser: toUser(otherUserRes.data || {}),
            lastMessage: null,
            unreadCount: 0,
          });
        }
      } catch (error: any) {
        const message = error?.response?.data?.error || 'Could not load chat';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, currentUser?.id, navigate]);

  const canSend = useMemo(() => !!message.trim() && !!id, [message, id]);

  if (loading) {
    return <div className="p-6">Loading chat...</div>;
  }

  if (!conversation) {
    return <div>Conversation not found</div>;
  }

  const otherUser = conversation.otherUser || conversation.participants?.[1];
  const currentUserId = currentUser?.id;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    try {
      const res = await messagesAPI.send({ conversationId: id, content: message.trim() });
      setMessages((prev) => [...prev, toMessage(res.data)]);
      setMessage("");
    } catch (error: any) {
      const errMessage = error?.response?.data?.error || 'Failed to send message';
      toast.error(errMessage);
    }
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
          {messages.length === 0 && (
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-[#F3F4F6] text-[#4B5563] text-sm rounded-full">
                No conversation history yet — send the first message.
              </div>
            </div>
          )}
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
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              disabled={!canSend}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
