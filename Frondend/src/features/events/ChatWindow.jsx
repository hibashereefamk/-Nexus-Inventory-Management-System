import React, { useEffect, useRef, useState } from 'react'

import {
  Phone,
  Mic,
  MicOff,
  Paperclip,
  Video,
  VideoOff,
  Search,
  BellOff,
  FolderOpen,
  Pin,
  Trash2,
  MoreVertical,
  Edit,
  PhoneOff,
  Maximize2,
  X
} from 'lucide-react'

import './chat.css'

import { useChat } from '../../context/ChatContext'
import MessageInput from './MessageInput'

// =====================================================
// CURRENT USER
// =====================================================

const currentUserId = Number(localStorage.getItem('user_id'))

// =====================================================
// STUN SERVERS
// =====================================================

const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    }
  ]
}

// =====================================================
// COMPONENT
// =====================================================

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
    sendReadReceipt,
    rejectCall,
    endCall
  } = useChat()

  // =================================================
  // MESSAGE STATE
  // =================================================

  const [openMenuId, setOpenMenuId] = useState(null)

  const [editingMessageId, setEditingMessageId] = useState(null)

  const [editingText, setEditingText] = useState('')

  const [showChatMenu, setShowChatMenu] = useState(false)

  // =================================================
  // CALL STATE
  // =================================================

  const [callState, setCallState] = useState('idle')

  /*
        idle
        calling
        incoming
        connected
        ended
    */

  const [callType, setCallType] = useState(null)

  /*
        AUDIO
        VIDEO
    */

  const [callId, setCallId] = useState(null)

  const [callerId, setCallerId] = useState(null)

  const [receiverId, setReceiverId] = useState(null)

  // =================================================
  // MEDIA STATE
  // =================================================

  const [isMuted, setIsMuted] = useState(false)

  const [cameraEnabled, setCameraEnabled] = useState(true)

  // =================================================
  // REFS
  // =================================================

  const messagesEndRef = useRef(null)

  const peerConnectionRef = useRef(null)

  const localStreamRef = useRef(null)

  const remoteStreamRef = useRef(null)

  const localVideoRef = useRef(null)

  const remoteVideoRef = useRef(null)

  const readMessagesRef = useRef(new Set())

  // =================================================
  // CONVERSATION NAME
  // =================================================

  const getConversationName = conversation => {
    if (conversation.conversation_type === 'DIRECT') {
      return conversation.other_user?.username || 'Direct Chat'
    }

    return conversation.name || 'Group Chat'
  }
  useEffect(() => {
  if (readMessagesRef.current) {
    readMessagesRef.current.clear()
  }
}, [activeConversation?.id])

  // =================================================
  // CONVERSATION OTHER USER
  // =================================================
useEffect(() => {
  if (
    !activeConversation ||
    !messages.length ||
    !sendReadReceipt ||
    !isConnected
  ) {
    return
  }

  messages.forEach(message => {
    const isReceivedMessage =
      Number(message.sender) !== currentUserId

    if (
      isReceivedMessage &&
      !message.is_read &&
      !readMessagesRef.current.has(message.id)
    ) {
      const sentSuccessfully = sendReadReceipt(message.id)

      if (sentSuccessfully) {
        readMessagesRef.current.add(message.id)

        console.log(
          'READ RECEIPT SENT SUCCESSFULLY:',
          message.id
        )
      }
    }
  })
}, [
  activeConversation?.id,
  messages,
  sendReadReceipt,
  isConnected
])
  const getOtherUserId = () => {
    if (activeConversation?.conversation_type !== 'DIRECT') {
      return null
    }

    return Number(activeConversation?.other_user?.id)
  }

  // =================================================
  // MESSAGE SCROLL
  // =================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  // =================================================
  // START EDIT
  // =================================================

  const startEditing = message => {
    setEditingMessageId(message.id)

    setEditingText(message.content || '')

    setOpenMenuId(null)
  }

  // =================================================
  // SAVE EDIT
  // =================================================

  const saveEdit = () => {
    if (!editingText.trim()) {
      return
    }

    editMessage(editingMessageId, editingText.trim())

    setEditingMessageId(null)

    setEditingText('')
  }

  // =================================================
  // CANCEL EDIT
  // =================================================

  const cancelEdit = () => {
    setEditingMessageId(null)

    setEditingText('')
  }

  // =================================================
  // MESSAGE CONTENT
  // =================================================

  const renderMessageContent = message => {
    if (message.is_deleted) {
      return <p className='deleted-message'>This message was deleted</p>
    }

    switch (message.message_type) {
      // =========================================
      // TEXT
      // =========================================

      case 'TEXT':
        return <p className='message-content'>{message.content}</p>

      // =========================================
      // IMAGE
      // =========================================

      case 'IMAGE':
        return (
          <div className='chat-image'>
            <img src={message.file_url} alt={message.file_name || 'Image'} />
          </div>
        )

      // =========================================
      // VIDEO
      // =========================================

      case 'VIDEO':
        return <video className='chat-video' controls src={message.file_url} />

      // =========================================
      // VOICE
      // =========================================

      case 'VOICE':
        return (
          <div className='voice-message'>
            <span>
              <Mic size={18} />
            </span>

            <audio controls src={message.file_url} />
          </div>
        )

      // =========================================
      // FILE
      // =========================================

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

  // =====================================================
  // CREATE PEER CONNECTION
  // =====================================================

  const createPeerConnection = (currentCallId, targetUserId, type) => {
    console.log('Creating PeerConnection', {
      currentCallId,
      targetUserId,
      type
    })

    const peerConnection = new RTCPeerConnection(ICE_SERVERS)

    peerConnectionRef.current = peerConnection

    // =============================================
    // REMOTE STREAM
    // =============================================

    const remoteStream = new MediaStream()

    remoteStreamRef.current = remoteStream

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }

    // =============================================
    // RECEIVE REMOTE TRACK
    // =============================================

    peerConnection.ontrack = event => {
      console.log('Remote track received')

      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track)
      })

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    // =============================================
    // ICE CANDIDATE
    // =============================================

    peerConnection.onicecandidate = event => {
      if (!event.candidate) {
        return
      }

      console.log('Sending ICE candidate')

      sendIceCandidate({
        callId: currentCallId,

        receiverId: targetUserId,

        candidate: event.candidate
      })
    }

    // =============================================
    // CONNECTION STATE
    // =============================================

    peerConnection.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', peerConnection.connectionState)

      if (peerConnection.connectionState === 'connected') {
        setCallState('connected')
      }

      if (peerConnection.connectionState === 'failed') {
        console.error('WebRTC connection failed')

        cleanupCall()
      }

      if (peerConnection.connectionState === 'disconnected') {
        console.log('WebRTC disconnected')
      }
    }

    // =============================================
    // ICE CONNECTION STATE
    // =============================================

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE state:', peerConnection.iceConnectionState)
    }

    return peerConnection
  }

  // =====================================================
  // GET LOCAL MEDIA
  // =====================================================

  

  const getLocalMedia = async type => {
    try {
      const constraints =
        type === 'VIDEO'
          ? {
              audio: true,
              video: true
            }
          : {
              audio: true,
              video: false
            }

      console.log('Requesting media:', constraints)

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (err) {
      console.error('Could not access microphone/camera:', err)

      alert('Please allow microphone/camera permission.')

      throw err
    }
  }

  // =====================================================
  // START CALL
  // =====================================================

  const startCall = async type => {
    if (!activeConversation) {
      return
    }

    // =============================================
    // ONLY DIRECT CALL FOR NOW
    // =============================================

    const targetUserId = getOtherUserId()

    if (!targetUserId) {
      alert('Calls are currently available only for direct chats.')

      return
    }

    if (targetUserId === currentUserId) {
      return
    }

    if (!isConnected) {
      alert('Chat connection is not ready.')

      return
    }

    try {
      const newCallId = `${Date.now()}-${currentUserId}-${targetUserId}`

      console.log('Starting call:', {
        newCallId,
        targetUserId,
        type
      })

      setCallId(newCallId)

      setCallType(type)

      setCallerId(currentUserId)

      setReceiverId(targetUserId)

      setCallState('calling')

      // =========================================
      // GET MICROPHONE / CAMERA
      // =========================================

      const localStream = await getLocalMedia(type)

      // =========================================
      // CREATE PEER
      // =========================================

      const peerConnection = createPeerConnection(newCallId, targetUserId, type)

      // =========================================
      // ADD LOCAL TRACKS
      // =========================================

      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })

      // =========================================
      // CREATE OFFER
      // =========================================

      const offer = await peerConnection.createOffer()

      await peerConnection.setLocalDescription(offer)

      // =========================================
      // SEND OFFER THROUGH WEBSOCKET
      // =========================================

      sendCallOffer({
        callId: newCallId,

        receiverId: targetUserId,

        offer,

        callType: type
      })

      console.log('Call offer sent')
    } catch (err) {
      console.error('Failed to start call:', err)

      cleanupCall()
    }
  }

  // =====================================================
  // INCOMING CALL
  // =====================================================

  useEffect(() => {
    const handleIncomingCall = event => {
      const data = event.detail

      console.log('Incoming call:', data)

      // =============================================
      // IGNORE OWN CALL
      // =============================================

      if (Number(data.caller_id) === currentUserId) {
        return
      }

      setCallId(data.call_id)

      setCallerId(Number(data.caller_id))

      setReceiverId(currentUserId)

      setCallType(data.call_type)

      // =============================================
      // SAVE OFFER
      // =============================================

      window.__incomingCallOffer = data.offer

      setCallState('incoming')
    }

    window.addEventListener('incoming-call', handleIncomingCall)

    return () => {
      window.removeEventListener('incoming-call', handleIncomingCall)
    }
  }, [])

  // =====================================================
  // ACCEPT INCOMING CALL
  // =====================================================

  const acceptCall = async () => {
    try {
      const incomingOffer = window.__incomingCallOffer

      if (!incomingOffer) {
        console.error('No incoming offer')

        return
      }

      const incomingCallId = callId

      const incomingCallerId = callerId

      const type = callType

      // =========================================
      // GET MEDIA
      // =========================================

      const localStream = await getLocalMedia(type)

      // =========================================
      // CREATE PEER
      // =========================================

      const peerConnection = createPeerConnection(
        incomingCallId,
        incomingCallerId,
        type
      )

      // =========================================
      // ADD LOCAL TRACKS
      // =========================================

      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })

      // =========================================
      // SET REMOTE OFFER
      // =========================================

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingOffer)
      )

      // =========================================
      // CREATE ANSWER
      // =========================================

      const answer = await peerConnection.createAnswer()

      await peerConnection.setLocalDescription(answer)

      // =========================================
      // SEND ANSWER
      // =========================================

      sendCallAnswer({
        callId: incomingCallId,

        callerId: incomingCallerId,

        answer
      })

      setCallState('connected')

      delete window.__incomingCallOffer

      console.log('Call accepted')
    } catch (err) {
      console.error('Failed to accept call:', err)

      cleanupCall()
    }
  }

  // =====================================================
  // CALL ANSWER RECEIVED
  // =====================================================

  useEffect(() => {
    const handleCallAnswer = async event => {
      const data = event.detail

      console.log('Received call answer:', data)

      if (data.call_id !== callId) {
        return
      }

      const peerConnection = peerConnectionRef.current

      if (!peerConnection) {
        console.error('Peer connection not found')

        return
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        )

        setCallState('connected')
      } catch (err) {
        console.error('Failed to set answer:', err)
      }
    }

    window.addEventListener('call-answer', handleCallAnswer)

    return () => {
      window.removeEventListener('call-answer', handleCallAnswer)
    }
  }, [callId])

  // =====================================================
  // ICE CANDIDATE RECEIVED
  // =====================================================

  useEffect(() => {
    const handleIceCandidate = async event => {
      const data = event.detail

      if (data.call_id !== callId) {
        return
      }

      const peerConnection = peerConnectionRef.current

      if (!peerConnection || !data.candidate) {
        return
      }

      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        )

        console.log('ICE candidate added')
      } catch (err) {
        console.error('Failed to add ICE candidate:', err)
      }
    }

    window.addEventListener('ice-candidate', handleIceCandidate)

    return () => {
      window.removeEventListener('ice-candidate', handleIceCandidate)
    }
  }, [callId])

  // =====================================================
  // REJECT INCOMING CALL
  // =====================================================

  const handleRejectCall = () => {
    if (callId && callerId) {
      rejectCall({
        callId,

        receiverId: callerId
      })
    }

    cleanupCall()
  }

  // =====================================================
  // END CALL
  // =====================================================

  const handleEndCall = () => {
    if (callId && receiverId) {
      endCall({
        callId,

        receiverId
      })
    }

    cleanupCall()
  }

  // =====================================================
  // CALL ENDED EVENT
  // =====================================================

  useEffect(() => {
    const handleCallEnded = event => {
      const data = event.detail

      if (data.call_id !== callId) {
        return
      }

      console.log('Other user ended call')

      cleanupCall()
    }

    window.addEventListener('call-ended', handleCallEnded)

    return () => {
      window.removeEventListener('call-ended', handleCallEnded)
    }
  }, [callId])

  // =====================================================
  // CALL REJECTED EVENT
  // =====================================================

  useEffect(() => {
    const handleCallRejected = event => {
      const data = event.detail

      if (data.call_id !== callId) {
        return
      }

      alert('Call was rejected.')

      cleanupCall()
    }

    window.addEventListener('call-rejected', handleCallRejected)

    return () => {
      window.removeEventListener('call-rejected', handleCallRejected)
    }
  }, [callId])

  // =====================================================
  // TOGGLE MICROPHONE
  // =====================================================

  const toggleMute = () => {
    const stream = localStreamRef.current

    if (!stream) {
      return
    }

    const audioTracks = stream.getAudioTracks()

    audioTracks.forEach(track => {
      track.enabled = !track.enabled
    })

    setIsMuted(!isMuted)
  }

  // =====================================================
  // TOGGLE CAMERA
  // =====================================================

  const toggleCamera = () => {
    const stream = localStreamRef.current

    if (!stream) {
      return
    }

    const videoTracks = stream.getVideoTracks()

    if (!videoTracks.length) {
      return
    }

    videoTracks.forEach(track => {
      track.enabled = !track.enabled
    })

    setCameraEnabled(!cameraEnabled)
  }

  // =====================================================
  // CLEANUP CALL
  // =====================================================

  const cleanupCall = () => {
    console.log('Cleaning WebRTC call')

    // =============================================
    // CLOSE PEER
    // =============================================

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()

      peerConnectionRef.current = null
    }

    // =============================================
    // STOP LOCAL MEDIA
    // =============================================

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })

      localStreamRef.current = null
    }

    // =============================================
    // STOP REMOTE MEDIA
    // =============================================

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })

      remoteStreamRef.current = null
    }

    // =============================================
    // CLEAR VIDEO
    // =============================================

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    // =============================================
    // RESET STATE
    // =============================================

    setCallState('idle')

    setCallType(null)

    setCallId(null)

    setCallerId(null)

    setReceiverId(null)

    setIsMuted(false)

    setCameraEnabled(true)

    delete window.__incomingCallOffer
  }

  // =====================================================
  // COMPONENT UNMOUNT CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
      }
    }
  }, [])

  // =====================================================
  // EMPTY CHAT
  // =====================================================

  if (!activeConversation) {
    return (
      <div className='empty-chat'>
        <div className='empty-chat-icon'>💬</div>

        <h2>Welcome to ERP Chat</h2>

        <p>Select a conversation to start messaging.</p>
      </div>
    )
  }

  // =====================================================
  // NAME
  // =====================================================

  const conversationName = getConversationName(activeConversation)

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className='chat-window'>
      {/* ================================================= */}
      {/* CHAT HEADER */}
      {/* ================================================= */}

      <div className='chat-header'>
        <div className='chat-user'>
          <div className='avatar large'>
            {conversationName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3>{conversationName}</h3>

            <span className={isConnected ? 'status online' : 'status offline'}>
              {isConnected ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* ================================================= */}
        {/* HEADER ACTIONS */}
        {/* ================================================= */}

        <div className='chat-actions'>
          {/* ============================================= */}
          {/* VOICE CALL */}
          {/* ============================================= */}

          <button
            type='button'
            className='chat-action-button'
            title='Voice call'
            onClick={() => startCall('AUDIO')}
            disabled={callState !== 'idle'}
          >
            <Phone size={19} strokeWidth={2} />
          </button>

          {/* ============================================= */}
          {/* VIDEO CALL */}
          {/* ============================================= */}

          <button
            type='button'
            className='chat-action-button'
            title='Video call'
            onClick={() => startCall('VIDEO')}
            disabled={callState !== 'idle'}
          >
            <Video size={19} strokeWidth={2} />
          </button>

          {/* ============================================= */}
          {/* THREE DOTS */}
          {/* ============================================= */}

          <div className='chat-menu-wrapper'>
            <button
              type='button'
              className='chat-action-button'
              title='More'
              onClick={() => setShowChatMenu(previous => !previous)}
            >
              <MoreVertical size={20} strokeWidth={2} />
            </button>

            {showChatMenu && (
              <div className='chat-settings-menu'>
                <button
                  onClick={() => {
                    console.log('Search messages')

                    setShowChatMenu(false)
                  }}
                >
                  <Search size={20} />

                  <span>Search messages</span>
                </button>

                <button
                  onClick={() => {
                    console.log('Mute notifications')

                    setShowChatMenu(false)
                  }}
                >
                  <BellOff size={20} />

                  <span>Mute notifications</span>
                </button>

                <button
                  onClick={() => {
                    console.log('Pinned messages')

                    setShowChatMenu(false)
                  }}
                >
                  <Pin size={20} />

                  <span>Pinned messages</span>
                </button>

                <button
                  onClick={() => {
                    console.log('Shared files')

                    setShowChatMenu(false)
                  }}
                >
                  <FolderOpen size={20} />

                  <span>Shared files</span>
                </button>

                <div className='menu-divider' />

                <button
                  className='danger-option'
                  onClick={() => {
                    console.log('Clear chat')

                    setShowChatMenu(false)
                  }}
                >
                  <Trash2 size={18} />

                  <span>Clear chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && <div className='chat-error'>{error}</div>}

      {/* ================================================= */}
      {/* MESSAGES */}
      {/* ================================================= */}

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
                {/* ================================= */}
                {/* MESSAGE BUBBLE */}
                {/* ================================= */}

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

                        {isSent && !message.is_deleted && (
        <span
            className={`read-status ${
                message.is_read ? "read" : ""
            }`}
            title={
                message.is_read
                    ? "Read"
                    : "Sent"
            }
        >
            {message.is_read ? "✓✓" : "✓"}
        </span>
    )}
                      </div>
                    </>
                  )}

                  {/* ================================= */}
                  {/* OWN MESSAGE MENU */}
                  {/* ================================= */}

                  {isSent &&
                    !message.is_deleted &&
                    editingMessageId !== message.id && (
                      <div className='message-menu-container'>
                        <button
                          className='message-menu-button'
                          onClick={() =>
                            setOpenMenuId(isMenuOpen ? null : message.id)
                          }
                          title='Message options'
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

      {/* ================================================= */}
      {/* MESSAGE INPUT */}
      {/* ================================================= */}

      <MessageInput />

      {/* ================================================= */}
      {/* CALL UI */}
      {/* ================================================= */}

      {callState !== 'idle' && (
        <div className='call-overlay'>
          {/* ================================================= */}
          {/* INCOMING CALL */}
          {/* ================================================= */}

          {callState === 'incoming' && (
            <div className='incoming-call-box'>
              <div className='incoming-call-icon'>
                {callType === 'VIDEO' ? (
                  <Video size={40} />
                ) : (
                  <Phone size={40} />
                )}
              </div>

              <h2>Incoming {callType === 'VIDEO' ? 'Video' : 'Voice'} Call</h2>

              <p>
                {activeConversation?.other_user?.username || 'Someone'} is
                calling you
              </p>

              <div className='incoming-call-actions'>
                <button className='accept-call-button' onClick={acceptCall}>
                  <Phone size={22} />
                  Accept
                </button>

                <button
                  className='reject-call-button'
                  onClick={handleRejectCall}
                >
                  <PhoneOff size={22} />
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* CALLING / CONNECTED */}
          {/* ================================================= */}

          {(callState === 'calling' || callState === 'connected') && (
            <div
              className={
                callType === 'VIDEO'
                  ? 'video-call-container'
                  : 'audio-call-container'
              }
            >
              {/* ========================================= */}
              {/* REMOTE VIDEO */}
              {/* ========================================= */}

              {callType === 'VIDEO' && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className='remote-video'
                />
              )}

              {/* ========================================= */}
              {/* AUDIO CALL */}
              {/* ========================================= */}

              {callType === 'AUDIO' && (
                <div className='audio-call-avatar'>
                  <div className='avatar call-avatar'>
                    {conversationName.charAt(0).toUpperCase()}
                  </div>

                  <h2>{conversationName}</h2>

                  <p>{callState === 'calling' ? 'Calling...' : 'Connected'}</p>
                </div>
              )}

              {/* ========================================= */}
              {/* LOCAL VIDEO */}
              {/* ========================================= */}

              {callType === 'VIDEO' && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className='local-video'
                />
              )}

              {/* ========================================= */}
              {/* CALL STATUS */}
              {/* ========================================= */}

              <div className='call-status'>
                {callState === 'calling' ? 'Calling...' : 'Connected'}
              </div>

              {/* ========================================= */}
              {/* CALL CONTROLS */}
              {/* ========================================= */}

              <div className='call-controls'>
                {/* MICROPHONE */}

                <button
                  className={isMuted ? 'call-control active' : 'call-control'}
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                {/* CAMERA */}

                {callType === 'VIDEO' && (
                  <button
                    className={
                      !cameraEnabled ? 'call-control active' : 'call-control'
                    }
                    onClick={toggleCamera}
                    title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                  >
                    {cameraEnabled ? (
                      <Video size={22} />
                    ) : (
                      <VideoOff size={22} />
                    )}
                  </button>
                )}

                {/* END */}

                <button
                  className='end-call-button'
                  onClick={handleEndCall}
                  title='End call'
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatWindow
