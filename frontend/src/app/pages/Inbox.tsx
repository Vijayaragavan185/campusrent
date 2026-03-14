import { Link } from "react-router";
import { MessageSquare } from "lucide-react";
import { mockConversations } from "../data/mockData";

export default function Inbox() {
  return (
    <div className="pb-20 md:pb-8 bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <h1 className="text-2xl text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Messages
          </h1>
        </div>
      </header>

      {/* Conversations List */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {mockConversations.length > 0 ? (
          <div className="space-y-3">
            {mockConversations.map((conversation) => {
              const otherUser = conversation.participants[1];
              
              return (
                <Link key={conversation.id} to={`/chat/${conversation.id}`}>
                  <div className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {/* Listing Thumbnail */}
                      <img
                        src={conversation.listing.images[0]}
                        alt={conversation.listing.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      
                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={otherUser.avatar}
                            alt={otherUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-[#111827]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                            {otherUser.name}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-auto w-6 h-6 bg-[#2D6BE4] text-white text-xs rounded-full flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-[#4B5563] mb-1 line-clamp-1">
                          {conversation.listing.title}
                        </p>
                        
                        <p className="text-sm text-[#4B5563] line-clamp-1">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-xs text-[#4B5563]">
                        {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-[#4B5563]" />
            </div>
            <h3 className="text-xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              No messages yet
            </h3>
            <p className="text-[#4B5563] mb-6">
              Start browsing listings to connect with others
            </p>
            <Link
              to="/home"
              className="inline-block px-6 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
