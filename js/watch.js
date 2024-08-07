let currentIndex = 0;
let currentIndexOfUser = 0;
let videos = [];
let users;

async function fetchVideos() {
  try {
    const response = await fetch("http://localhost:3000/api/videos");
    if (!response.ok) {
      throw new Error("Failed to fetch videos");
    }
    const data = await response.json();
    videos = data;

    if (videos.length > 0) {
      displayVideo(currentIndex);
      fetchUsers(); // Fetch users after videos are successfully fetched
    }
  } catch (error) {
    console.error("Error fetching videos:", error.message);
    alert("Failed to fetch videos. Please try again later.");
  }
}

async function fetchUsers() {
  try {
    if (videos.length === 0) {
      throw new Error("No videos available to fetch user data.");
    }
    const publickey = videos[currentIndex].publickey; // Lấy publickey từ video hiện tại
    const response = await fetch(`http://localhost:3000/api/user/${publickey}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }
    const data = await response.json();

    users = data;

    displayUser(currentIndexOfUser);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    alert("Failed to fetch users. Please try again later.");
  }
}

function displayVideo(index) {
  const videoPlayer = document.getElementById("videoPlayer");
  const title = document.getElementById("title");
  const content = document.getElementById("content");

  videoPlayer.src = "http://localhost:3000" + videos[index].url;
  title.textContent = `${videos[index].title}`;
  content.textContent = `${videos[index].content}`;
}

function displayUser(index) {
  const imgOfUser = document.getElementById("imgUser");
  const nameUser = document.getElementById("nameOfUser");

  imgOfUser.src = "http://localhost:3000" + users.img;
  nameUser.textContent = `${users.name}`;
}

document.getElementById("nextBtn").addEventListener("click", () => {
  if (videos.length > 0) {
    currentIndex = (currentIndex + 1) % videos.length;
    displayVideo(currentIndex);
    fetchUsers(); // Update user information for the new video
  }
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (videos.length > 0) {
    currentIndex = (currentIndex - 1 + videos.length) % videos.length;
    displayVideo(currentIndex);
    fetchUsers(); // Update user information for the new video
  }
});

//comment
document.querySelector("#comment").addEventListener("click", function () {
  var popup = document.getElementById("popup");
  var shortsContainer = document.querySelector(".shorts-container");

  if (popup.style.display === "none" || popup.style.display === "") {
    popup.style.display = "block";
    shortsContainer.style.transform = "translateX(-150px)";
  } else {
    popup.style.display = "none";
    shortsContainer.style.transform = "translateX(0)";
  }
});

// Add scroll effect
window.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) {
    currentIndex = (currentIndex + 1) % videos.length;
  } else {
    currentIndex = (currentIndex - 1 + videos.length) % videos.length;
  }
  displayVideo(currentIndex);
  fetchUsers(); // Update user information for the new video
});

// Fetch videos on page load
fetchVideos();


let publicKey = null;
    let from = null;
    let to = null; 

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
        if (!provider) return;
        document.getElementById('pubkey').innerText = publicKey;

        try {
            const resp = await provider.connect();
            publicKey = resp.publicKey.toString();
            showMessage(`Connected: ${publicKey}`);
            document.getElementById('pubkey').innerText = publicKey;
            document.getElementById('connectButton').style.display = 'none';
            document.getElementById('walletDropdown').style.display = 'block';
            document.getElementById('walletDropdownButton').innerText = `...${publicKey.slice(-5)}`;
            document.getElementById('publicKeyFull').innerText = publicKey;
            localStorage.setItem('phantomConnected', 'true');
            await checkUser(publicKey);
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
            localStorage.removeItem('phantomConnected');
        } catch (err) {
            console.error(err);
            showMessage(`Error: ${err.message}`);
        }
    };

    // Auto connect wallet if not connected on page load
    document.addEventListener('DOMContentLoaded', async () => {
        const provider = getProvider();
        const isPreviouslyConnected = localStorage.getItem('phantomConnected');

        if (!provider.isConnected && isPreviouslyConnected === 'true') {
            await connectWallet();
        }
    });

    const showMessage = (message, duration = 3000) => {
        const statusMessage = document.getElementById('statusMessage');
        const messageContent = document.getElementById('messageContent');
        messageContent.innerText = message;
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, duration);
    };




    document.getElementById('claim').addEventListener('click', async (event) => {
      event.preventDefault(); // Prevent default form submission
    
      const payload = {
        recipientPublicKeyString: publicKey,
        amount: from
      };
    
      // Debugging logs
      console.log('Sending Data:', payload);
    
      try {
        const response = await fetch('http://localhost:3000/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
    
        // Check response and log the status
        if (response.ok) {
          alert('Successfully!');
          console.log('Response Status:', response.status);
        } else {
          alert('Failed. Please try again.');
          console.log('Response Status:', response.status);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      }
    });
    