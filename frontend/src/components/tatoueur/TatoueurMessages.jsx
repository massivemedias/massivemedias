import { useState, useEffect } from 'react';
import { MessageSquare, Send, Clock } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import api from '../../services/api';

export default function TatoueurMessages({ tatoueur }) {
  const { tx } = useLang();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    async function fetchMessages() {
      if (!tatoueur?.documentId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/tattoo-messages', {
          params: {
            'filters[tatoueur][documentId][$eq]': tatoueur.documentId,
            sort: 'createdAt:desc',
            'pagination[pageSize]': 50,
          },
        });
        setMessages(data.data || []);
      } catch (err) {
        console.warn('[TatoueurMessages] Erreur:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [tatoueur?.documentId]);

  // Group messages by conversationId
  const conversations = messages.reduce((acc, msg) => {
    const key = msg.conversationId || msg.senderEmail;
    if (!acc[key]) acc[key] = { messages: [], senderName: msg.senderName, senderEmail: msg.senderEmail, unread: 0 };
    acc[key].messages.push(msg);
    if (msg.status === 'new') acc[key].unread++;
    return acc;
  }, {});

  const convoList = Object.entries(conversations).sort((a, b) => {
    const aDate = a[1].messages[0]?.createdAt || '';
    const bDate = b[1].messages[0]?.createdAt || '';
    return bDate.localeCompare(aDate);
  });

  if (loading) {
    return <div className="text-center py-12 text-grey-muted animate-pulse">...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-heading">
        {tx({ fr: 'Messages', en: 'Messages' })}
      </h2>

      {convoList.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-white/5">
          <MessageSquare className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
          <p className="text-grey-muted">
            {tx({ fr: 'Aucun message pour le moment.', en: 'No messages yet.' })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversation list */}
          <div className="space-y-2 md:border-r md:border-white/5 md:pr-4">
            {convoList.map(([key, convo]) => {
              const lastMsg = convo.messages[0];
              const isSelected = selectedConvo === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedConvo(key)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isSelected ? 'bg-accent/15 border border-accent/30' : 'bg-bg-card border border-white/5 hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-heading text-sm truncate">{convo.senderName}</span>
                    {convo.unread > 0 && (
                      <span className="bg-accent text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {convo.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-grey-muted truncate mt-0.5">
                    {lastMsg?.content?.slice(0, 50)}...
                  </p>
                  <p className="text-[10px] text-grey-muted mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleDateString() : ''}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Message detail */}
          <div className="md:col-span-2">
            {selectedConvo && conversations[selectedConvo] ? (
              <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col" style={{ maxHeight: '60vh' }}>
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                  <span className="font-bold text-heading">{conversations[selectedConvo].senderName}</span>
                  <span className="text-xs text-grey-muted ml-2">{conversations[selectedConvo].senderEmail}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversations[selectedConvo].messages.slice().reverse().map((msg, i) => (
                    <div key={i} className={`flex ${msg.senderType === 'tatoueur' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                        msg.senderType === 'tatoueur' ? 'bg-accent/20 text-heading' : 'bg-bg-elevated text-grey-light'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] text-grey-muted mt-1">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="p-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={tx({ fr: 'Ecrire un message...', en: 'Write a message...' })}
                      className="flex-1 bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
                    />
                    <button
                      disabled={!reply.trim()}
                      className="btn-primary !py-2 !px-3"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-bg-card rounded-xl border border-white/5 p-8 text-center">
                <MessageSquare className="w-8 h-8 text-grey-muted/30 mx-auto mb-2" />
                <p className="text-sm text-grey-muted">
                  {tx({ fr: 'Selectionne une conversation', en: 'Select a conversation' })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
