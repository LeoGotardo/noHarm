export const handleRequest = (data) => {
    const userId = data.user_id;
    console.log('Friend request received from', userId);
}

export const handleAccept = (data) => {
    const userId = data.user_id;
    console.log('Friend request accepted from', userId);
}

export const handleReject = (data) => {
    const userId = data.user_id;
    console.log('Friend request rejected from', userId);
}

export const handleRemove = (data) => {
    const userId = data.user_id;
    console.log('Friend removed from', userId);
}

export const handleBlock = (data) => {
    const userId = data.user_id;
    console.log('Friend blocked from', userId);
}

export const handleUnblock = (data) => {
    const userId = data.user_id;
    console.log('Friend unblocked from', userId);
}