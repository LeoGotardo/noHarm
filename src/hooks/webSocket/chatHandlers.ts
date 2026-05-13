export const handleNewMessage = (data) => {
    const userId = data.user_id;
    console.log('Sent message to', userId);
}

export const handleMarkRead = (data) => {
    const userId = data.user_id;
    console.log('Marked chat read with', userId);
}

export const handleTyping = (data) => {
    const userId = data.user_id;
    console.log('Typing in chat with', userId);
}

export const chatError = (data) => {
    console.log('Error', data);
}