import { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import {Paperclip,Smile,Mic,Send,StopCircle} from "lucide-react"
import { useChat } from "../../context/ChatContext"; // Ensure token & activeConversation are exported here or via your AuthContext

const MessageInput = () => {
  // Grab activeConversation, token, and API base URL from context
  const { sendMessage, isConnected, activeConversation, token, API } = useChat();

  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleEmojiClick = (emojiData) => {
    setMessage((previous) => previous + emojiData.emoji);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage("");
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

 const sendFileUploadRequest = async (
    file,
    messageType
) => {

    if (!activeConversation?.id) {
        console.error(
            "No active conversation selected."
        );
        return;
    }

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "message_type",
        messageType
    );

    try {

        const response = await fetch(

            `${API}/api/chat/conversations/${activeConversation.id}/upload/`,

            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },

                body: formData,
            }
        );


        if (!response.ok) {

            const errorData =
                await response.json();

            console.error(
                "Upload error:",
                errorData
            );

            throw new Error(
                "Upload failed"
            );
        }


        const data =
            await response.json();

        console.log(
            "✅ File uploaded:",
            data
        );


    } catch (error) {

        console.error(
            "❌ Error uploading file:",
            error
        );

    }
};

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await sendFileUploadRequest(file, getMessageType(file));
    event.target.value = ""; // Reset input after upload
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
      />

      {/* Trigger File Input */}
      <button
        type="button"
        className="attachment-button"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip size={20} />
      </button>

      {/* Voice Recording Button */}
      <button
        type="button"
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? <StopCircle size={20}/> : <Mic size={20} />}
      </button>

      {/* Emoji Picker */}
      <div className="emoji-container">
        <button type="button" onClick={() => setShowEmoji((prev) => !prev)}>
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
        placeholder={isRecording ? "Recording voice..." : "Type a message..."}
        disabled={isRecording}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!isConnected || !message.trim()}
      >
         <Send size={19} />
      </button>
    </div>
  );
};

export default MessageInput;