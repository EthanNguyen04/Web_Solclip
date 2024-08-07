
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
    formData.append('publickey', publicKey); // Attach the public key
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

// Preview selected image before form submission
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

   