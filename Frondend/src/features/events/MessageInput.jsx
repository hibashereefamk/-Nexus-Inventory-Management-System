import { useState } from "react";

import { useChat } from "../../context/ChatContext";


const MessageInput = () => {

    const [message, setMessage] = useState("");

    const {
        sendMessage,
        isConnected
    } = useChat();


    const handleSubmit = (event) => {

        event.preventDefault();

        const trimmedMessage =
            message.trim();


        if (!trimmedMessage) {
            return;
        }


        if (!isConnected) {
            return;
        }


        sendMessage(trimmedMessage);

        setMessage("");
    };


    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            handleSubmit(event);
        }
    };


    return (
        <form
            className="message-input-container"
            onSubmit={handleSubmit}
        >

            <button
                type="button"
                className="input-action"
                title="Attach file"
            >
                📎
            </button>


            <button
                type="button"
                className="input-action"
                title="Emoji"
            >
                😊
            </button>


            <textarea
                value={message}
                onChange={(event) =>
                    setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                    isConnected
                        ? "Type a message..."
                        : "Connecting..."
                }
                disabled={!isConnected}
                rows={1}
            />


            <button
                type="submit"
                className="send-button"
                disabled={
                    !isConnected ||
                    !message.trim()
                }
            >
                ➤
            </button>

        </form>
    );
};


export default MessageInput;