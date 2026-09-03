import React, { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { Paperclip, Smile, Mic, Send, StopCircle } from "lucide-react";
import { useChat } from "../../context/ChatContext";

const MessageInput = () => {
  // Pull setMessages (or handleNewMessage) along with other values from context
  const {
    sendMessage,
    isConnected,
    activeConversation,
    token,
    API,
    setMessages, 
  } = useChat();

  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleEmojiClick = (emojiData) => {
    setMessage((previous) => previous + emojiData.emoji);
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (!isConnected) {
      console.error("WebSocket is not connected.");
      return;
    }

    sendMessage(trimmedMessage);
    setMessage("");
    setShowEmoji(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const getMessageType = (file) => {
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.startsWith("video/")) return "VIDEO";
    if (file.type.startsWith("audio/")) return "VOICE";
    return "FILE";
  };

  const sendFileUploadRequest = async (file, messageType) => {
    if (!activeConversation?.id) {
      console.error("No active conversation selected.");
      return;
    }
    if (!token) {
      console.error("Authentication token is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("message_type", messageType);

    try {
      setIsUploading(true);
      const response = await fetch(
        `${API}/api/chat/conversations/${activeConversation.id}/upload/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: "Upload failed." };
        }
        console.error("Upload error:", errorData);
        throw new Error(errorData.detail || "File upload failed.");
      }

      const uploadedMessage = await response.json();
      console.log("✅ File uploaded:", uploadedMessage);

      // CRITICAL STEP: Manually push the created file message into your state 
      // if WebSocket doesn't broadcast uploaded attachments immediately.
      if (setMessages) {
        setMessages((prev) => [...prev, uploadedMessage]);
      }
    } catch (error) {
      console.error("❌ Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const messageType = getMessageType(file);
    await sendFileUploadRequest(file, messageType);
    event.target.value = ""; // Reset file input
  };

  const uploadAudio = async (audioBlob) => {
    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
      type: "audio/webm",
    });
    await sendFileUploadRequest(audioFile, "VOICE");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone permission or hardware error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="chat-input-container">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />

      {/* Trigger File Input */}
      <button
        type="button"
        className="attachment-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={!isConnected || isUploading || isRecording}
        title="Attach file"
      >
        <Paperclip size={20} />
      </button>

      {/* Voice Recording Button */}
      <button
        type="button"
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!isConnected || isUploading}
        title={isRecording ? "Stop recording" : "Record voice"}
      >
        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
      </button>

      {/* Emoji Picker */}
      <div className="emoji-container">
        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          disabled={isRecording || isUploading}
          title="Emoji"
        >
          <Smile size={20} />
        </button>

        {showEmoji && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* Text Field */}
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isRecording
            ? "Recording voice..."
            : isUploading
            ? "Uploading..."
            : "Type a message..."
        }
        disabled={isRecording || isUploading || !isConnected}
      />

      {/* Send Button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!isConnected || !message.trim() || isRecording || isUploading}
        title="Send message"
      >
        <Send size={19} />
      </button>
    </div>
  );
};

export default MessageInput;