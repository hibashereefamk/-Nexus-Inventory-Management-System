import React, { useEffect, useRef, useState } from 'react'
import {
  Phone,
  Mic,
  Paperclip,
  Video,
  Search,
  BellOff,
  FolderOpen,
  Pin,
  Trash2,
  MoreVertical,
  Edit,
  MessageSquare
} from 'lucide-react'

import './chat.css'
import { useChat } from '../../context/ChatContext'
import MessageInput from './MessageInput'

const currentUserId = Number(localStorage.getItem('user_id'))

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

const ChatWindow = () => {
  const {
    activeConversation,
    messages,
    isConnected,
    error,
    editMessage,
    deleteMessage,
    sendCallOffer,
    sendCallAnswer,
    sendIceCandidate,
    rejectCall,
    endCall
  } = useChat()

  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showChatMenu, setShowChatMenu] = useState(false)

  const [callState, setCallState] = useState('idle')
  const [callType, setCallType] = useState(null)
  const [callId, setCallId] = useState(null)
  const [callerId, setCallerId] = useState(null)
  const [receiverId, setReceiverId] = useState(null)

  const [isMuted, setIsMuted] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)

  const messagesEndRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const getConversationName = conversation => {
    if (!conversation) return ''
    if (conversation.conversation_type === 'DIRECT') {
      return conversation.other_user?.username || 'Direct Chat'
    }
    return conversation.name || 'Group Chat'
  }

  const getOtherUserId = () => {
    if (activeConversation?.conversation_type !== 'DIRECT') return null
    return Number(activeConversation?.other_user?.id)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startEditing = message => {
    setEditingMessageId(message.id)
    setEditingText(message.content || '')
    setOpenMenuId(null)
  }

  const saveEdit = () => {
    if (!editingText.trim()) return
    editMessage(editingMessageId, editingText.trim())
    setEditingMessageId(null)
    setEditingText('')
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  const renderMessageContent = message => {
    if (message.is_deleted) {
      return <p className='deleted-message'>This message was deleted</p>
    }

    switch (message.message_type) {
      case 'TEXT':
        return <p className='message-content'>{message.content}</p>
      case 'IMAGE':
        return (
          <div className='chat-image'>
            <img src={message.file_url} alt={message.file_name || 'Image'} />
          </div>
        )
      case 'VIDEO':
        return <video className='chat-video' controls src={message.file_url} />
      case 'VOICE':
        return (
          <div className='voice-message'>
            <span>
              <Mic size={18} />
            </span>
            <audio controls src={message.file_url} />
          </div>
        )
      case 'FILE':
        return (
          <a
            href={message.file_url}
            target='_blank'
            rel='noopener noreferrer'
            className='chat-file'
          >
            <span className='file-icon'>
              <Paperclip size={20} />
            </span>
            <span>{message.file_name || 'Download file'}</span>
          </a>
        )
      default:
        return <p className='message-content'>{message.content}</p>
    }
  }

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop())
      remoteStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

    setCallState('idle')
    setCallType(null)
    setCallId(null)
    setCallerId(null)
    setReceiverId(null)
    setIsMuted(false)
    setCameraEnabled(true)
    delete window.__incomingCallOffer
  }

  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) peerConnectionRef.current.close()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // =====================================================
  // RENDER MAIN WINDOW
  // =====================================================

  return (
    <div className='chat-window'>
      {!activeConversation ? (
        /* PLACEHOLDER WHEN NO CONVERSATION IS SELECTED */
        <div className='empty-chat'>
          <div className='empty-chat-icon'>
            <MessageSquare size={48} />
          </div>
          <h2>Select a Chat</h2>
          <p>Choose a contact or group from the list to start messaging.</p>
        </div>
      ) : (
        /* ACTIVE CONVERSATION UI */
        <>
          {/* CHAT HEADER */}
          <div className='chat-header'>
            <div className='chat-user'>
              <div className='avatar large'>
                {getConversationName(activeConversation).charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{getConversationName(activeConversation)}</h3>
                <span className={isConnected ? 'status online' : 'status offline'}>
                  {isConnected ? 'Online' : 'Connecting...'}
                </span>
              </div>
            </div>

            <div className='chat-actions'>
              <button
                type='button'
                className='chat-action-button'
                title='Voice call'
                onClick={() => {}}
                disabled={callState !== 'idle'}
              >
                <Phone size={19} strokeWidth={2} />
              </button>

              <button
                type='button'
                className='chat-action-button'
                title='Video call'
                onClick={() => {}}
                disabled={callState !== 'idle'}
              >
                <Video size={19} strokeWidth={2} />
              </button>

              <div className='chat-menu-wrapper'>
                <button
                  type='button'
                  className='chat-action-button'
                  title='More'
                  onClick={() => setShowChatMenu(prev => !prev)}
                >
                  <MoreVertical size={20} strokeWidth={2} />
                </button>

                {showChatMenu && (
                  <div className='chat-settings-menu'>
                    <button onClick={() => setShowChatMenu(false)}>
                      <Search size={20} />
                      <span>Search messages</span>
                    </button>
                    <button onClick={() => setShowChatMenu(false)}>
                      <BellOff size={20} />
                      <span>Mute notifications</span>
                    </button>
                    <button onClick={() => setShowChatMenu(false)}>
                      <Pin size={20} />
                      <span>Pinned messages</span>
                    </button>
                    <button onClick={() => setShowChatMenu(false)}>
                      <FolderOpen size={20} />
                      <span>Shared files</span>
                    </button>
                    <div className='menu-divider' />
                    <button
                      className='danger-option'
                      onClick={() => setShowChatMenu(false)}
                    >
                      <Trash2 size={18} />
                      <span>Clear chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ERROR DISPLAY */}
          {error && <div className='chat-error'>{error}</div>}

          {/* MESSAGES THREAD */}
          <div className='messages-container'>
            {messages.map(message => {
              const isSent = Number(message.sender) === currentUserId
              const isMenuOpen = openMenuId === message.id

              return (
                <div
                  key={message.id}
                  className={isSent ? 'message-row sent' : 'message-row received'}
                >
                  <div className='message-wrapper'>
                    <div className='message-bubble'>
                      {!isSent && (
                        <div className='message-sender'>{message.sender_name}</div>
                      )}

                      {editingMessageId === message.id ? (
                        <div className='edit-message-box'>
                          <input
                            type='text'
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            autoFocus
                          />
                          <div className='edit-actions'>
                            <button onClick={saveEdit}>Save</button>
                            <button onClick={cancelEdit}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {renderMessageContent(message)}
                          <div className='message-bottom'>
                            <span className='message-time'>
                              {message.created_at &&
                                new Date(message.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  }
                                )}
                            </span>
                            {message.is_edited && (
                              <span className='edited-label'>edited</span>
                            )}
                          </div>
                        </>
                      )}

                      {isSent &&
                        !message.is_deleted &&
                        editingMessageId !== message.id && (
                          <div className='message-menu-container'>
                            <button
                              className='message-menu-button'
                              onClick={() =>
                                setOpenMenuId(isMenuOpen ? null : message.id)
                              }
                            >
                              ⋮
                            </button>

                            {isMenuOpen && (
                              <div className='message-dropdown'>
                                <button onClick={() => startEditing(message)}>
                                  <Edit size={20} />
                                  Edit
                                </button>
                                <button
                                  className='delete-option'
                                  onClick={() => {
                                    deleteMessage(message.id)
                                    setOpenMenuId(null)
                                  }}
                                >
                                  <Trash2 size={20} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <MessageInput />
        </>
      )}
    </div>
  )
}

export default ChatWindow