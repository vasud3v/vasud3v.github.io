import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  reply_to_id?: string;
  metadata?: Record<string, any>;
  sender?: {
    id: string;
    username: string;
    avatar: string;
  };
  reply_to?: {
    id: string;
    content: string;
    sender: {
      username: string;
    };
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  is_archived: boolean;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  last_message?: Message;
  other_participant?: {
    id: string;
    username: string;
    avatar: string;
    is_online: boolean;
  };
}

export interface MessageSettings {
  allow_messages_from: 'everyone' | 'following' | 'none';
}

export function useMessagingEnhanced(currentUserId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageSettings, setMessageSettings] = useState<MessageSettings>({
    allow_messages_from: 'following'
  });

  useEffect(() => {
    if (!currentUserId) return;
    
    fetchConversations();
    fetchMessageSettings();
    
    // Subscribe to new messages and conversation changes
    const channel = supabase
      .channel(`messages-enhanced-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${currentUserId}`
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchMessageSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_users')
        .select('allow_messages_from')
        .eq('id', currentUserId)
        .single();

      if (error) throw error;
      if (data) {
        setMessageSettings({ allow_messages_from: data.allow_messages_from });
      }
    } catch (error) {
      console.error('Error fetching message settings:', error);
    }
  };

  const updateMessageSettings = async (settings: MessageSettings) => {
    try {
      const { error } = await supabase
        .from('forum_users')
        .update({ allow_messages_from: settings.allow_messages_from })
        .eq('id', currentUserId);

      if (error) throw error;

      setMessageSettings(settings);
      toast.success('Message settings updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    }
  };

  const fetchConversations = async () => {
    try {
      // Get user's conversations
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          unread_count,
          last_read_at,
          is_muted,
          is_pinned,
          left_at,
          conversations (
            id,
            created_at,
            updated_at,
            last_message_at,
            is_archived
          )
        `)
        .eq('user_id', currentUserId)
        .is('left_at', null)
        .order('last_read_at', { ascending: false });

      if (participantError) throw participantError;

      // For each conversation, get the other participant and last message
      const conversationsWithDetails = await Promise.all(
        (participantData || []).map(async (p: any) => {
          const convId = p.conversation_id;
          
          // Get other participant
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              forum_users (
                id,
                username,
                avatar,
                is_online
              )
            `)
            .eq('conversation_id', convId)
            .neq('user_id', currentUserId)
            .is('left_at', null)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:forum_users!messages_sender_id_fkey (
                id,
                username,
                avatar
              )
            `)
            .eq('conversation_id', convId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: p.conversations.id,
            created_at: p.conversations.created_at,
            updated_at: p.conversations.updated_at,
            last_message_at: p.conversations.last_message_at,
            is_archived: p.conversations.is_archived,
            unread_count: p.unread_count,
            is_muted: p.is_muted,
            is_pinned: p.is_pinned,
            last_message: lastMessage,
            other_participant: otherParticipant?.forum_users
          };
        })
      );

      // Sort: pinned first, then by last message time
      conversationsWithDetails.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        const aTime = a.last_message_at || a.updated_at;
        const bTime = b.last_message_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const startConversation = async (targetUserId: string): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: convId, error } = await supabase
        .rpc('get_conversation_with_user', { target_user_id: targetUserId });

      if (error) throw error;

      fetchConversations();
      return convId;
    } catch (error: any) {
      if (error.message.includes('cannot message')) {
        toast.error('You need to follow this user to send them a message');
      } else {
        toast.error(error.message || 'Failed to start conversation');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    conversationId: string, 
    content: string,
    replyToId?: string
  ) => {
    try {
      // Validate content
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        toast.error('Message cannot be empty');
        return;
      }

      if (trimmedContent.length > 5000) {
        toast.error('Message is too long (max 5000 characters)');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: trimmedContent,
          reply_to_id: replyToId
        });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
      throw error;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const trimmedContent = newContent.trim();
      if (!trimmedContent) {
        toast.error('Message cannot be empty');
        return;
      }

      if (trimmedContent.length > 5000) {
        toast.error('Message is too long (max 5000 characters)');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .update({ content: trimmedContent })
        .eq('id', messageId)
        .eq('sender_id', currentUserId);

      if (error) throw error;

      toast.success('Message updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to edit message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', currentUserId);

      if (error) throw error;

      toast.success('Message deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .rpc('mark_conversation_read', { conv_id: conversationId });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const toggleMute = async (conversationId: string, isMuted: boolean) => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_muted: !isMuted })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      if (error) throw error;

      toast.success(isMuted ? 'Conversation unmuted' : 'Conversation muted');
      fetchConversations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update mute status');
    }
  };

  const togglePin = async (conversationId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_pinned: !isPinned })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      if (error) throw error;

      toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      fetchConversations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update pin status');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .rpc('delete_conversation', { conv_id: conversationId });

      if (error) throw error;

      toast.success('Conversation deleted');
      fetchConversations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete conversation');
    }
  };

  const getTotalUnreadCount = useCallback(() => {
    return conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  }, [conversations]);

  return {
    conversations,
    loading,
    messageSettings,
    startConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    toggleMute,
    togglePin,
    deleteConversation,
    updateMessageSettings,
    getTotalUnreadCount,
    refreshConversations: fetchConversations
  };
}

export function useConversationMessagesEnhanced(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!conversationId) return;
    
    setPage(0);
    setHasMore(true);
    fetchMessages(0);
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation-enhanced-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchMessages(0);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchMessages = async (pageNum: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:forum_users!messages_sender_id_fkey (
            id,
            username,
            avatar
          ),
          reply_to:messages!messages_reply_to_id_fkey (
            id,
            content,
            sender:forum_users!messages_sender_id_fkey (
              username
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      const newMessages = (data || []).reverse();
      
      if (pageNum === 0) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }

      setHasMore(newMessages.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
  };

  return { 
    messages, 
    loading, 
    hasMore,
    loadMore,
    refreshMessages: () => fetchMessages(0) 
  };
}
