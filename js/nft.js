
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
document.addEventListener('DOMContentLoaded', () => {
  const dropdownButton = document.getElementById('walletDropdownButton');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const dropdown = document.querySelector('.dropdown');

  dropdownButton.addEventListener('click', () => {
      dropdown.classList.toggle('show'); // Toggle visibility of dropdown
  });

  // Close dropdown if clicked outside
  window.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
          dropdown.classList.remove('show');
      }
  });
});

// Add user form submit handler
document.getElementById('addUserForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('publicKey', publicKey);

    try {
        const response = await fetch('http://localhost:3000/api/add-user', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message);
            document.getElementById('addUserModal').querySelector('.btn-close').click();
        } else {
            showMessage('Error adding user');
        }
    } catch (err) {
        console.error('Error adding user:', err);
        showMessage(`Error: ${err.message}`);
    }
});

// Function to render NFTs
const renderNfts = async () => {
  try {
      const response = await fetch('http://localhost:3000/api/nfts');
      const nfts = await response.json();
      console.log('Fetched NFTs:', nfts); // Debugging line
      const nftList = document.getElementById('nftList');

      nftList.innerHTML = nfts.map(nft => `
          <div class="col-md-4 mb-4">
              <div class="card">
                  <img src="${nft.imageUrl}" class="card-img-top" alt="${nft.title}">
                  <div class="card-body">
                      <h5 class="card-title">${nft.name}</h5>
                      <p class="card-text">MINT ${nft.from} to solc ${nft.to}</p>
                      <button class="btn btn-primary" onclick="openBuyNftModal('${nft.id}')">Buy NFT</button>
                  </div>
              </div>
          </div>
      `).join('');
  } catch (err) {
      console.error('Error rendering NFTs:', err);
      showMessage(`Error: ${err.message}`);
  }
};


const openBuyNftModal = (idNFT) => {
console.log('Opening Buy NFT Modal with ID:', idNFT);
document.getElementById('idNFT').value = idNFT;
document.getElementById('buyerId').value = publicKey;
const buyNftModal = document.getElementById('buyNftModal');
buyNftModal.style.display = 'block';
};

const closeBuyNftModal = () => {
const buyNftModal = document.getElementById('buyNftModal');
buyNftModal.style.display = 'none';
};

document.getElementById('buyNftForm').addEventListener('submit', async (event) => {
event.preventDefault();
const idNFT = document.getElementById('idNFT').value;
const buyerId = document.getElementById('buyerId').value;

try {
  const response = await fetch('http://localhost:3000/api/buy-nft', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idNFT, buyerId })
  });

  const result = await response.json();

  if (response.ok) {
      const messageElement = document.getElementById('message');
      messageElement.innerHTML = `Please complete your purchase by <a href="${result.consentUrl}" target="_blank">clicking here</a>.`;
  } else {
      throw new Error('Failed to buy NFT.');
  }
} catch (err) {
  console.error('Error:', err);
  const messageElement = document.getElementById('message');
  messageElement.textContent = 'Failed to buy NFT. Please try again.';
}
});

document.addEventListener('DOMContentLoaded', renderNfts);

// Wallet button and dialog handling
const showWalletDialog = () => {
    document.getElementById('walletDialog').style.display = 'flex';
};

const closeWalletDialog = () => {
    document.getElementById('walletDialog').style.display = 'none';
};

document.getElementById('walletButton').addEventListener('click', showWalletDialog);
document.getElementById('closeWalletDialog').addEventListener('click', closeWalletDialog);

window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('walletDialog')) {
        closeWalletDialog();
    }
});

document.addEventListener('DOMContentLoaded', () => {
  // Function to fetch and display NFTs
  const fetchAndDisplayNfts = async () => {
      const ownerReferenceId = publicKey; // Replace with actual publicKey

      try {
          const response = await fetch('http://localhost:3000/api/fetch-nfts', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ownerReferenceId })
          });

          const data = await response.json();
          const resultsDiv = document.getElementById('nftResults');
          resultsDiv.innerHTML = ''; // Clear previous results

          if (data.data && data.data.length > 0) {
              data.data.forEach(nft => {
                  const nftCard = document.createElement('div');
                  nftCard.className = 'nft-card';

                  const nftImage = document.createElement('img');
                  nftImage.src = nft.item.imageUrl;
                  nftImage.alt = nft.item.name;

                  const nftTitle = document.createElement('h3');
                  nftTitle.textContent = nft.item.name;

                  const nftInfo = document.createElement('p');
                  nftInfo.textContent = `ID: ${nft.item.id}`;

                  const useNftButton = document.createElement('button');
                  useNftButton.className = 'btn btn-primary';
                  useNftButton.textContent = 'Use NFT';
                  useNftButton.addEventListener('click', () => {
                      sendNftIdToApi(nft.item.id); // Send idNft when button is clicked
                  });

                  nftCard.appendChild(nftImage);
                  nftCard.appendChild(nftTitle);
                  nftCard.appendChild(nftInfo);
                  nftCard.appendChild(useNftButton);

                  resultsDiv.appendChild(nftCard);
              });
          } else {
              resultsDiv.textContent = 'No NFTs found for this owner reference ID.';
          }
      } catch (err) {
          console.error(err);
          document.getElementById('nftResults').textContent = 'An error occurred while fetching NFTs.';
      }
  };

  // Function to send idNft to the API
  const sendNftIdToApi = async (idNft) => {
      const pk = publicKey; // Replace with actual publicKey
      try {
          const response = await fetch(`http://localhost:3000/api/update-user-nft/${pk}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ idNft })
          });

          if (response.ok) {
              const updatedUser = await response.json();
              alert('NFT successfully used!');
              console.log('Updated User:', updatedUser);
          } else {
              console.error('Failed to update user with NFT');
          }
      } catch (err) {
          console.error('Error sending NFT ID to API:', err);
      }
  };

  // Wallet button and dialog handling
  const showWalletDialog = () => {
      document.getElementById('walletDialog').style.display = 'flex';
      fetchAndDisplayNfts(); // Fetch and display NFTs when wallet dialog is opened
  };

  const closeWalletDialog = () => {
      document.getElementById('walletDialog').style.display = 'none';
  };

  document.getElementById('walletButton').addEventListener('click', showWalletDialog);
  document.getElementById('closeWalletDialog').addEventListener('click', closeWalletDialog);

  window.addEventListener('click', (event) => {
      if (event.target === document.getElementById('walletDialog')) {
          closeWalletDialog();
      }
  });
});
