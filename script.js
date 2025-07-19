/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Keep track of selected products by their id */
// Try to load selectedProductIds from localStorage, or start with an empty array
let selectedProductIds = [];
const savedIds = localStorage.getItem("selectedProductIds");
if (savedIds) {
  try {
    selectedProductIds = JSON.parse(savedIds);
  } catch {
    selectedProductIds = [];
  }
}

/* Helper function to save selectedProductIds to localStorage */
function saveSelectedProductIds() {
  localStorage.setItem(
    "selectedProductIds",
    JSON.stringify(selectedProductIds)
  );
}

/* Create HTML for displaying product cards, with selection logic */
function displayProducts(products) {
  // Show each product card with name, brand, and a "View Details" button
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${
      selectedProductIds.includes(product.id) ? " selected" : ""
    }" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-brand">${product.brand}</p>
        <button class="view-details-btn" data-id="${
          product.id
        }">View Details</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to each product card for selection
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent selection if clicking the "View Details" button
      if (e.target.classList.contains("view-details-btn")) return;
      const id = Number(card.getAttribute("data-id"));
      // Toggle selection
      if (selectedProductIds.includes(id)) {
        selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      } else {
        selectedProductIds.push(id);
      }
      saveSelectedProductIds(); // Save to localStorage after change
      // Re-render products to update selection state
      displayProducts(products);
      // Update the selected products section
      updateSelectedProductsList(products);
    });
  });

  // Add event listeners for "View Details" buttons
  const detailBtns = document.querySelectorAll(".view-details-btn");
  detailBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card selection
      const id = btn.getAttribute("data-id");
      const product = products.find((p) => p.id === Number(id));
      showProductModal(product);
    });
  });

  // Update selected products list after rendering
  updateSelectedProductsList(products);
}

/* Show a modal window with product details */
function showProductModal(product) {
  // Remove any existing modal
  const oldModal = document.getElementById("productModal");
  if (oldModal) oldModal.remove();

  // Create modal HTML
  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal-close" aria-label="Close">&times;</button>
      <img src="${product.image}" alt="${product.name}" class="modal-img">
      <h2 id="modalTitle">${product.name}</h2>
      <p class="product-brand">${product.brand}</p>
      <div class="modal-description">${product.description}</div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal on button click or overlay click
  modal.querySelector(".modal-close").onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

/* Show selected products below the grid */
function updateSelectedProductsList(allProducts) {
  // Get the container for selected products
  const selectedProductsList = document.getElementById("selectedProductsList");

  // Filter the products to only those that are selected
  const selectedProducts = allProducts.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  // If no products are selected, show a placeholder message
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected yet.</div>`;
    // Remove the clear all button if present
    const clearBtn = document.getElementById("clearAllBtn");
    if (clearBtn) clearBtn.remove();
    return;
  }

  // Show each selected product in a mini card with a remove button
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="product-card mini" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <button class="remove-btn" title="Remove" aria-label="Remove product">&times;</button>
      </div>
    `
    )
    .join("");

  // Add "Clear All" button if not already present
  if (!document.getElementById("clearAllBtn")) {
    const clearAllBtn = document.createElement("button");
    clearAllBtn.id = "clearAllBtn";
    clearAllBtn.textContent = "Clear All";
    clearAllBtn.style.margin = "16px 0 0 0";
    clearAllBtn.style.background = "#e3a535";
    clearAllBtn.style.color = "#fff";
    clearAllBtn.style.border = "none";
    clearAllBtn.style.padding = "8px 18px";
    clearAllBtn.style.borderRadius = "6px";
    clearAllBtn.style.cursor = "pointer";
    clearAllBtn.style.fontWeight = "500";
    clearAllBtn.onclick = () => {
      selectedProductIds = [];
      saveSelectedProductIds();
      updateSelectedProductsList(allProducts);
      // Optionally, re-render the grid to remove selection highlights
      const currentCards = document.querySelectorAll(
        ".product-card:not(.mini)"
      );
      const currentProducts = Array.from(currentCards).map((card) => {
        const id = Number(card.getAttribute("data-id"));
        return allProducts.find((p) => p.id === id);
      });
      displayProducts(currentProducts);
    };
    selectedProductsList.parentElement.insertBefore(
      clearAllBtn,
      selectedProductsList.nextSibling
    );
  }

  // Add event listeners to remove buttons
  const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Prevent card click event
      e.stopPropagation();
      const card = btn.closest(".product-card");
      const id = Number(card.getAttribute("data-id"));
      // Remove from selectedProductIds
      selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      saveSelectedProductIds(); // Save to localStorage after change
      // Re-render both products and selected list
      const currentCards = document.querySelectorAll(
        ".product-card:not(.mini)"
      );
      const currentProducts = Array.from(currentCards).map((card) => {
        const id = Number(card.getAttribute("data-id"));
        return allProducts.find((p) => p.id === id);
      });
      displayProducts(currentProducts);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

// Replace this with your actual Worker endpoint URL
const WORKER_API_URL = "https://your-worker-endpoint-url.com/api/openai";

/* Listen for follow-up questions in the chat form */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = chatForm.querySelector("input").value.trim();
  if (!userInput) return;

  // Show the user's question in the chat window
  chatWindow.innerHTML += `<div class="user-message">${userInput}</div>`;
  chatForm.querySelector("input").value = "";
  chatWindow.innerHTML += `<div class="assistant-message">Thinking...</div>`;

  // Add the user's question to the conversation history
  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  try {
    // Send the updated conversation to your Worker endpoint instead of OpenAI directly
    const response = await fetch(WORKER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    // Remove the "Thinking..." message
    chatWindow.innerHTML = chatWindow.innerHTML.replace(
      `<div class="assistant-message">Thinking...</div>`,
      ""
    );

    // Show the assistant's reply if it's relevant to the routine or beauty topics
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      chatWindow.innerHTML += `<div class="assistant-message">${data.choices[0].message.content}</div>`;
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      chatWindow.innerHTML += `<div class="assistant-message">Sorry, something went wrong. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div class="assistant-message">Error connecting to the API endpoint.</div>`;
    console.error(error);
  }
});

/* On initial load, display the full product list */
displayProducts(initialProducts);
