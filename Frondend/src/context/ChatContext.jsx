import React, { createContext, useContext, useState } from "react";
import useChatSocket from "../hooks/useChatSocket";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [activeConversation, setActiveConversation] = useState(null);

  const API = "http://127.0.0.1:8000";
  const token = localStorage.getItem("access_token");

  const openConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const {
        messages,
        setMessages,
        isConnected,
        error,

        sendMessage,
        editMessage,
        deleteMessage,

        sendCallOffer,
        sendCallAnswer,
        sendIceCandidate,

        rejectCall,
        endCall,

    } = useChatSocket(
        conversationId,
        token,
        currentUserId
    );

  return (
        <ChatContext.Provider
            value={{

                messages,

                setMessages,

                isConnected,

                error,

                sendMessage,

                editMessage,

                deleteMessage,

                sendCallOffer,

                sendCallAnswer,

                sendIceCandidate,

                rejectCall,

                endCall,

            }}
        >
            {children}
        </ChatContext.Provider>
    );

  
};

export const useChat = () => {

    const context = useContext(ChatContext);

    if (!context) {
        throw new Error(
            "useChat must be used inside ChatProvider"
        );
    }

    return context;
};