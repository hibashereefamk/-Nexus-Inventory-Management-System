
import React, {
    createContext,
    useContext,
    useState
} from "react";

import useChatSocket from "../hooks/useChatSocket";


const ChatContext = createContext(null);


export const ChatProvider = ({ children }) => {

    // =====================================================
    // ACTIVE CONVERSATION
    // =====================================================

    const [
        activeConversation,
        setActiveConversation
    ] = useState(null);


    // =====================================================
    // API
    // =====================================================

    const API =
        "http://127.0.0.1:8000";


    // =====================================================
    // JWT TOKEN
    // =====================================================

    const token =
        localStorage.getItem("access_token");


    // =====================================================
    // CURRENT USER
    // =====================================================

    /*
       Change this according to how you store
       the logged-in user's information.

       Example:
       localStorage.setItem("user", JSON.stringify(user))
    */

    const currentUserId = Number(
    localStorage.getItem("user_id")
);

const currentUser =
    localStorage.getItem("username");



    // =====================================================
    // CONVERSATION ID
    // =====================================================

    const conversationId =
        activeConversation?.id || null;


    // =====================================================
    // OPEN CONVERSATION
    // =====================================================

    const openConversation = (
        conversation
    ) => {

        setActiveConversation(
            conversation
        );

    };


    // =====================================================
    // CHAT SOCKET
    // =====================================================

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


    // =====================================================
    // CONTEXT
    // =====================================================

    return (

        <ChatContext.Provider
            value={{

                // Conversation
                activeConversation,
                setActiveConversation,
                openConversation,

                // API / Auth
                API,
                token,
                currentUserId,

                // Messages
                messages,
                setMessages,

                // Socket
                isConnected,
                error,

                // Message actions
                sendMessage,
                editMessage,
                deleteMessage,

                // Call signaling
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


// =====================================================
// USE CHAT
// =====================================================

export const useChat = () => {

    const context =
        useContext(ChatContext);


    if (!context) {

        throw new Error(
            "useChat must be used inside ChatProvider"
        );

    }


    return context;

};

