import React, {
    createContext,
    useContext,
    useState
} from "react";

import useChatSocket from "../hooks/useChatSocket";


const ChatContext = createContext(null);


export const ChatProvider = ({ children }) => {

    const [activeConversation, setActiveConversation] =
        useState(null);

    /*
     * Change this according to your existing
     * authentication/token storage.
     */
    const token = localStorage.getItem("access_token");


    const {
        messages,
        sendMessage,
        isConnected,
        error
    } = useChatSocket(
        activeConversation?.id,
        token
    );


    return (
        <ChatContext.Provider
            value={{
                activeConversation,
                setActiveConversation,

                messages,
                sendMessage,

                isConnected,
                error
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