const flameBody = document.querySelector('.flamebot-body');
const messageInput = document.querySelector('.message-input');
const sendMessageButton = document.querySelector('#send-message');
const fileInput = document.querySelector('#file-input');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
const fileCancelButton = document.querySelector('#file-cancel');
const flameBotToggler =  document.querySelector('#chat-toggler');
const closeChatBot = document.querySelector('#flamebot-close');

// API
const API_KEY = `AIzaSyCw3Z2Zn0QwWMreBoqYjVF0DSfQP3Z1I4o`
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const dataUser = {
    message: null,
    file: {
        data : null,
        mime_type : null
    }
}

// Create a message element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Generate Bot Response
const generateBotResponse = async (incomingMessage) => {
    const messageElement = incomingMessage.querySelector(".message-text");

    // Build JSON payload
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: dataUser.message }, // User message as text
                    ...(dataUser.file.data
                        ? [
                              {
                                  inline_data: {
                                      mime_type: dataUser.file.mime_type,
                                      data: dataUser.file.data, // Base64-encoded image
                                  },
                              },
                          ]
                        : []), // Add inline_data part only if file exists
                ],
            },
        ],
    };

    // API request options
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        // Display bot response
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;
    } catch (error) {
        console.error(error);
        messageElement.innerText = error.message;
        messageElement.style.color = "red";
    } finally {
        // Reset file data and remove thinking indicator
        dataUser.file = { data: null, mime_type: null };
        incomingMessage.classList.remove("thinking");
        flameBody.scrollTo({ top: flameBody.scrollHeight, behavior: "smooth" });
    }
};


// Handle Outgoing Message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    dataUser.message = messageInput.value.trim(); // Store user message
    if (!dataUser.message) return; // Exit if the message is empty

    // Create outgoing message
    const messageContent = `<div class="message-text"></div>${dataUser.file.data ? `<img src="data:${dataUser.file.mime_type};base64,${dataUser.file.data}" class="attachment" >` : ""}`;
    const outgoingMessage = createMessageElement(messageContent, "user-message");
    outgoingMessage.querySelector(".message-text").textContent = dataUser.message;
    flameBody.appendChild(outgoingMessage);
    flameBody.scrollTo( {top: flameBody.scrollHeight, behavior: "smooth"} )

    //simulate response
    setTimeout(() => {
        const messageContent = `<svg class="bot-avatar"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="orange">
                <path d="M12 2C10.2 4.8 8 7.4 8 10.5c0 2.2 1.8 3.5 3 4.5-1 1-2 2-2 3.5 0 2 1.5 3.5 3 3.5s3-1.5 3-3.5c0-1.5-1-2.5-2-3.5 1.2-1 3-2.3 3-4.5 0-3.1-2.2-5.7-4-8.5zM12 21c-1.1 0-2-.9-2-2 0-.6.3-1.1.8-1.5.5-.4 1.2-.8 1.2-1.5 0-.8-.7-1.5-1.5-2.2-1.1-.9-2.5-1.9-2.5-3.8 0-2.4 1.8-4.4 3-6 1.2 1.6 3 3.6 3 6 0 1.9-1.4 2.9-2.5 3.8-.8.7-1.5 1.4-1.5 2.2 0 .6.7 1.1 1.2 1.5.5.4.8.9.8 1.5 0 1.1-.9 2-2 2z" />
              </svg> 
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>`;
        const incomingMessage = createMessageElement(messageContent, "bot-message","thinking");
        flameBody.appendChild(incomingMessage);

        generateBotResponse(incomingMessage);

    },600);

    // Clear input after sending
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
}

// Handle Keydown Event
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent newline
        handleOutgoingMessage(e); // Send the message
    }
});

// Handle File Upload and Preview it
fileInput.addEventListener("change", (e) => {
    const file = fileInput.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {

        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];

        // Store file in dataUser
        dataUser.file = {
            data : base64String,
            mime_type : file.type
        }  
        
        fileInput.value = "";
    }
    console.log(dataUser);
    reader.readAsDataURL(file);

});

fileCancelButton.addEventListener("click", () => {
    fileInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize Emoji Picker and Add it to the DOM
const picker = new EmojiMart.Picker({
    theme: "dark",
    skinTonePosition : "none",
    previewPosition : "none",

    onEmojiSelect: (emoji) => {
        const {selectionStart : start,selectionEnd : end} = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },

    onClickOutside: (e) => {
        if(e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
    }else{
        document.body.classList.remove("show-emoji-picker");
    }
    }
});

document.querySelector(".chat-form").appendChild(picker);
// Handle Click Event
sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

flameBotToggler.addEventListener("click", () => document.body.classList.toggle("show-flameBot"));
closeChatBot.addEventListener("click", () => document.body.classList.remove("show-flameBot"));