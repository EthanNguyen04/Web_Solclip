
let publicKey = null; // Change const to let for mutable publicKey

// Function to get Phantom provider
const getProvider = () => {
    if ('phantom' in window) {
        const provider = window.phantom?.solana;

        if (provider?.isPhantom) {
            return provider;
        }
    }
    window.open('https://phantom.app/', '_blank');
};

// Function to connect wallet
const connectWallet = async () => {
    const provider = getProvider();
    try {
        const resp = await provider.connect();
        publicKey = resp.publicKey.toString();
        showMessage(`Connected: ${publicKey}`);
        document.getElementById('connectButton').style.display = 'none';
        document.getElementById('walletDropdown').style.display = 'block';
        document.getElementById('token').style.display = 'block';
        document.getElementById('walletDropdownButton').innerText = `...${publicKey.slice(-5)}`;
        document.getElementById('publicKeyFull').innerText = publicKey;

        // Save connection state in localStorage
        localStorage.setItem('phantomConnected', 'true');

        // Check if user exists on server
        checkUser(publicKey);
    } catch (err) {
        console.error(err);
        showMessage(`Error: ${err.message}`);
    }
};

// Function to disconnect wallet
const disconnectWallet = async () => {
    const provider = getProvider();
    try {
        await provider.disconnect();
        showMessage('Disconnected');
        document.getElementById('connectButton').style.display = 'block';
        document.getElementById('walletDropdown').style.display = 'none';
        document.getElementById('token').style.display = 'none';
        // Remove connection state from localStorage
        localStorage.removeItem('phantomConnected');
    } catch (err) {
        console.error(err);
        showMessage(`Error: ${err.message}`);
    }
};

// Auto connect wallet if not connected on page load
document.addEventListener('DOMContentLoaded', async () => {
    const provider = getProvider();

    // Check localStorage for previous connection
    const isPreviouslyConnected = localStorage.getItem('phantomConnected');

    if (!provider.isConnected && isPreviouslyConnected === 'true') {
        await connectWallet();
    }
});

const showMessage = (message, duration = 3000) => {
    const statusMessage = document.getElementById('statusMessage');
    const messageContent = document.getElementById('messageContent');

    // Set the message content
    messageContent.innerText = message;

    // Show the status message
    statusMessage.style.display = 'block';

    // Hide the status message after `duration` milliseconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, duration);
};

// Function to check if user exists
const checkUser = async (publicKey) => {
    try {
        const response = await fetch(`http://localhost:3000/api/check-user/${publicKey}`);
        const result = await response.json();
        if (!result.exists) {
            // Show add user modal if user does not exist
            const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
            addUserModal.show();
        }
    } catch (err) {
        console.error('Error checking user:', err);
        showMessage(`Error: ${err.message}`);
    }
};

// Add user form submit handler
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('publickey', publicKey);
    try {
        const response = await fetch('http://localhost:3000/api/add-user', {
            method: 'POST',
            body: formData
        });
        const result = await response.text();
        showMessage(result);
        const addUserModal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        addUserModal.hide();
    } catch (err) {
        console.error('Error adding user:', err);
        showMessage(`Error: ${err.message}`);
    }
});

document.getElementById('userImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('selectedImage');
            img.src = e.target.result;
            img.style.display = 'block'; // Show the image
        };
        reader.readAsDataURL(file);
    }
});

const fetchUserInfo = async (publicKey) => {
    try {
        const response = await fetch(`http://localhost:3000/api/user/${publicKey}`);
        const user = await response.json();
        displayUserInfo(user);
    } catch (err) {
        console.error('Error fetching user info:', err);
        showMessage(`Error: ${err.message}`);
    }
};

// Function to display user info
const displayUserInfo = (user) => {
    const userProfile = document.querySelector('.user-profile');
    userProfile.innerHTML = `
        <img src="http://localhost:3000${user.img}" alt="User Image" style="border-radius: 100px; width:200px;height:200px; object-fit: cover;" >
        <p style="font-size: 30px;">${user.name}</p>
        `;
};

// Function to fetch and display videos for a user
const fetchUserVideos = async (publicKey) => {
    try {
        const response = await fetch(`http://localhost:3000/api/videos/user/${publicKey}`);
        const videos = await response.json();
        displayUserVideos(videos);
    } catch (err) {
        console.error('Error fetching user videos:', err);
        showMessage(`Error: ${err.message}`);
    }
};

// Function to display user videos
const displayUserVideos = (videos) => {
    const userDemo = document.querySelector('.user-demo');
    userDemo.innerHTML = ''; // Clear previous content

    if (videos.length === 0) {
        userDemo.innerHTML = '<p>No videos found.</p>';
        return;
    }

    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        
        const videoElement = document.createElement('video');
        videoElement.muted = true;
        videoElement.loop = true;
        
        const sourceElement = document.createElement('source');
        sourceElement.src = `http://localhost:3000${video.url}`;
        sourceElement.type = 'video/mp4';
        
        videoElement.appendChild(sourceElement);
        videoCard.appendChild(videoElement);
        userDemo.appendChild(videoCard);
        
        // Add event listeners for hover play/pause
        videoCard.addEventListener('mouseover', () => {
            videoElement.play();
        });
        
        videoCard.addEventListener('mouseout', () => {
            videoElement.pause();
        });
    });
};



// Auto connect wallet and fetch user info and videos if connected
document.addEventListener('DOMContentLoaded', async () => {
    const provider = getProvider();
    const isPreviouslyConnected = localStorage.getItem('phantomConnected');

    if (!provider.isConnected && isPreviouslyConnected === 'true') {
        await connectWallet();
    }

    if (publicKey) {
        fetchUserInfo(publicKey);
        fetchUserVideos(publicKey);
    }
});
//upload video
function openUploadDialog() {
    document.getElementById('uploadDialog').style.display = 'block';
}

function closeUploadDialog() {
    document.getElementById('uploadDialog').style.display = 'none';
}

function showPreview(event) {
    var file = event.target.files[0];
    if (file) {
        var videoPreview = document.getElementById('videoPreview');
        videoPreview.src = URL.createObjectURL(file);
        videoPreview.style.display = 'block';
    }
}

document.getElementById('uploadForm').addEventListener('submit', async (event)=> {
    event.preventDefault(); // Prevent default form submission

    var formData = new FormData();
    formData.append('publickey', publicKey);
    formData.append('title', document.getElementById('title').value);
    formData.append('content', document.getElementById('content').value);
    formData.append('file', document.getElementById('file').files[0]);

    fetch('http://localhost:3000/api/upload-video', { // Change to your server's upload URL
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.ok) {
            alert('Video uploaded successfully!');
            closeUploadDialog();
            // Optionally, refresh the video list or perform other actions
        } else {
            alert('Failed to upload video. Please try again.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('An error occurred while uploading the video. Please try again.');
    });
});