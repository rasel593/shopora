let products = [];
let cart = [];
// =========================
// WISHLIST
// =========================

// বর্তমানে user-এর wishlist items
let wishlist = [];

// ================================
// SHOPORA ADVANCED SEARCH & FILTER
// ================================

// পণ্যের তালিকা ফিল্টার করে দেখানো
function filterShoporaProducts() {
  // Search input থেকে লেখা নেওয়া
  const searchText = (
    document.getElementById("shoporaSearch")?.value || ""
  ).trim().toLowerCase();

  // নির্বাচিত category নেওয়া
  const category = (
    document.getElementById("shoporaCategory")?.value || ""
  );

  // সর্বনিম্ন ও সর্বোচ্চ দাম নেওয়া
  const minValue = document.getElementById("shoporaMinPrice")?.value;
  const maxValue = document.getElementById("shoporaMaxPrice")?.value;

  const minPrice = minValue === "" || minValue == null
    ? 0
    : Number(minValue);

  const maxPrice = maxValue === "" || maxValue == null
    ? Infinity
    : Number(maxValue);

  // পণ্যের নাম, category ও দাম অনুযায়ী filter
  let filtered = products.filter(product => {
    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchText) ||
      (product.description || "").toLowerCase().includes(searchText) ||
      (product.category || "").toLowerCase().includes(searchText);

    const matchesCategory =
      !category || product.category === category;

    const matchesMinPrice = product.price >= minPrice;
    const matchesMaxPrice = product.price <= maxPrice;

    return matchesSearch &&
      matchesCategory &&
      matchesMinPrice &&
      matchesMaxPrice;
  });

  // পণ্য সাজানোর নিয়ম
  const sort = document.getElementById("shoporaSort")?.value || "default";

  if (sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "name-az") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // আগের showProducts ব্যবহার করে ফলাফল দেখানো
  showProducts(filtered);

  // ফলাফলের সংখ্যা দেখানো
  const count = document.getElementById("shoporaResultCount");
  if (count) {
    count.textContent = `Found ${filtered.length} product(s)`;
  }
}

// Category dropdown-এ পণ্যের category যোগ করা
function setupShoporaFilters() {
  const categorySelect = document.getElementById("shoporaCategory");

  if (categorySelect) {
    const currentCategory = categorySelect.value;
    const categories = [...new Set(
      products.map(product => product.category).filter(Boolean)
    )].sort();

    categorySelect.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    categorySelect.value = categories.includes(currentCategory)
      ? currentCategory
      : "";
  }
}

// Search ও Filter-এর event চালু করা
function initializeShoporaFilters() {
  const ids = [
    "shoporaSearch",
    "shoporaCategory",
    "shoporaMinPrice",
    "shoporaMaxPrice",
    "shoporaSort"
  ];

  ids.forEach(id => {
    const element = document.getElementById(id);

    if (element && !element.dataset.filterReady) {
      element.addEventListener("input", filterShoporaProducts);
      element.addEventListener("change", filterShoporaProducts);
      element.dataset.filterReady = "true";
    }
  });

  const resetButton = document.getElementById("shoporaResetFilters");

  if (resetButton && !resetButton.dataset.filterReady) {
    resetButton.addEventListener("click", () => {
      document.getElementById("shoporaSearch").value = "";
      document.getElementById("shoporaCategory").value = "";
      document.getElementById("shoporaMinPrice").value = "";
      document.getElementById("shoporaMaxPrice").value = "";
      document.getElementById("shoporaSort").value = "default";

      filterShoporaProducts();
    });

    resetButton.dataset.filterReady = "true";
  }
}

// পেজের HTML তৈরি হলে filter event চালু করা
document.addEventListener("DOMContentLoaded", initializeShoporaFilters);

async function loadProducts() {
  
  console.log("Loading products...");
  
  try {
    
    const productsRef =
      window.firebaseCollection(
        window.shoporaDB,
        "products"
      );
    
    const snapshot =
      await window.firebaseGetDocs(productsRef);
    
    products = [];
    
    snapshot.forEach(item => {
      
      const data = item.data();
      
      console.log("Product found:", data);
      
      // Firestore থেকে সব Product তথ্য লোড করা
          products.push({
            id: item.id,
            name: data.name || "Unnamed Product",
            price: Number(data.price) || 0,
            category: data.category || "Other",
            image: data.image || "",
            stock: Number(data.stock) || 0,
            description: data.description || "",
            
            // Product-এর Size অপশন লোড করা
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            
            // Product-এর Color অপশন লোড করা
            colors: Array.isArray(data.colors) ? data.colors : []
          });
      
    });
    
    console.log(
      "Total products:",
      products.length
    );
  
    showProducts(products);
    
    // পণ্য লোড হলে category ও filter আপডেট করা
setupShoporaFilters();
filterShoporaProducts();
    
  } catch (error) {
    
    console.error(
      "PRODUCT ERROR:",
      error
    );
    
    document.getElementById("productList").innerHTML = `
      <div class="empty">
        Product load হয়নি 😔
        <br><br>
        আবার চেষ্টা করুন।
      </div>
    `;
  }
}

// ========================================
// SHOW PRODUCTS
// ========================================

function showProducts(list = products) {
  
  // Product list container
  const box =
    document.getElementById("productList");
  
  // পুরোনো product card পরিষ্কার করা
  box.innerHTML = "";
  
  // কোনো product না থাকলে message দেখাবে
  if (list.length === 0) {
    
    box.innerHTML = `
      <div class="empty">
        No products available 🛍️
      </div>
    `;
    
    return;
  }
  
  // প্রতিটি product card তৈরি করা
  list.forEach(product => {
    
    // Product wishlist-এ আছে কিনা check করা
    const isWishlisted =
      wishlist.some(
        item => item.id === product.id
      );
    
    // Wishlist অনুযায়ী heart icon
    const heartIcon =
      isWishlisted ? "❤️" : "♡";
    
    box.innerHTML += `

      <div class="product"
           onclick="openProductDetails('${product.id}')">

        <!-- Wishlist button -->
        <button
          class="wishlistButton"
          onclick="event.stopPropagation(); toggleWishlist('${product.id}')"
        >
          ${heartIcon}
        </button>

        <!-- Product image -->
        <img
          src="${product.image || ""}"
          alt="${product.name}"
        >

        <!-- Product name -->
        <h3>${product.name}</h3>

        <!-- Product price -->
        <div class="price">
          ৳${Number(product.price || 0).toLocaleString()}
        </div>

        <!-- Add to Cart button -->
        <button
          onclick="event.stopPropagation(); addToCart('${product.id}')"
        >
          Add to Cart
        </button>

      </div>

    `;
  });
}
;


// ========================================
// SHOPORA: ADD PRODUCT TO CART WITH VARIANTS
// ========================================
async function addToCart(id, quantity = 1) {
  const user = window.shoporaAuth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  const product = products.find(p => p.id === id);

  if (!product) {
    alert("Product not found.");
    return;
  }

  // Product Details থেকে নির্বাচিত Size ও Color নেওয়া
  let size = "";
  let color = "";

  const sizeSelect = document.getElementById("detailSize");
  const colorSelect = document.getElementById("detailColor");

  // Details-এ একই product খোলা থাকলে selection নেওয়া
  if (typeof selectedProduct !== "undefined" &&
      selectedProduct?.id === id) {
    size = sizeSelect?.value || "";
    color = colorSelect?.value || "";
  }

  // যেসব product-এ Size/Color আছে, সেগুলো নির্বাচন বাধ্যতামূলক
  if (Array.isArray(product.sizes) &&
      product.sizes.length > 0 && !size) {
    alert("Please select a size.");
    return;
  }

  if (Array.isArray(product.colors) &&
      product.colors.length > 0 && !color) {
    alert("Please select a color.");
    return;
  }

  // Variant অনুযায়ী আলাদা Cart document ID তৈরি
  const variantKey = `${size || "no-size"}_${color || "no-color"}`
    .replace(/[\/.#$[\]]/g, "_");

  const cartItemId = `${product.id}_${variantKey}`;

  try {
    const cartRef = window.firebaseDoc(
      window.shoporaDB,
      "users",
      user.uid,
      "cart",
      cartItemId
    );

    const existing = await window.firebaseGetDoc(cartRef);

    let finalQuantity = Number(quantity) || 1;

    if (existing.exists()) {
      finalQuantity += Number(existing.data().quantity || 0);
    }

    // Stock-এর সীমা যাচাই
    if (Number(product.stock) >= 0 &&
        finalQuantity > Number(product.stock)) {
      alert(`Only ${product.stock} items available.`);
      return;
    }

    // Cart-এ product ও variant-এর তথ্য সেভ
    await window.firebaseSetDoc(cartRef, {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || "",
      quantity: finalQuantity,
      size: size,
      color: color,
      cartItemId: cartItemId
    });

    await loadCart();

    alert("Added to cart 🛒");
  } catch (error) {
    console.error("CART ERROR:", error);
    alert("Cart error: " + (error?.message || "Unknown error"));
  }
}

async function loadCart() {
  const user = window.shoporaAuth.currentUser;
  
  if (!user) return;
  
  try {
    const cartRef = window.firebaseCollection(
      window.shoporaDB,
      "users",
      user.uid,
      "cart"
    );
    
    const snapshot = await window.firebaseGetDocs(cartRef);
    
    cart = [];
    
    snapshot.forEach(item => {
      cart.push({
        id: item.id,
        ...item.data()
      });
    });
    
    updateCart();
    
    console.log("Cart loaded:", cart);
    
  } catch (error) {
    console.error("Cart loading error:", error);
  }
};

function updateCart() {
  
  const cartItems = document.getElementById("cartItems");
  const totalElement = document.getElementById("total");
  const cartCount = document.getElementById("cartCount");
  
  if (!cartItems) return;
  
  // Cart empty
  if (cart.length === 0) {
    
    cartItems.innerHTML = `
      <div class="emptyCart">
        <div class="emptyCartIcon">🛒</div>

        <h3>Your cart is empty</h3>

        <p>Add some products to your cart.</p>
      </div>
    `;
    
    if (totalElement) {
      totalElement.innerText = "0";
    }
    
    if (cartCount) {
      cartCount.innerText = "0";
    }
    
    return;
  }
  
  
  let subtotal = 0;
  let totalQuantity = 0;
  
  cart.forEach(item => {
    
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);
    
    subtotal += price * quantity;
    totalQuantity += quantity;
    
  });
  
  
  // Delivery charge
  const deliveryCharge = subtotal >= 2000 ? 0 : 60;
  
  const grandTotal = subtotal + deliveryCharge;
  
  
  // Cart count
  if (cartCount) {
    cartCount.innerText = totalQuantity;
  }
  
  
  // Render cart items
  cartItems.innerHTML = cart.map(item => {
    
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);
    
    const itemTotal = price * quantity;
    
    return `
      <div class="cartItem">

        <img
          src="${item.image || ""}"
          alt="${item.name}"
        >

        <div class="cartItemInfo">

         
            <h3>${item.name}</h3>
            
            <!-- নির্বাচিত Size দেখানো; না থাকলে লুকানো -->
            ${item.size ? `<p class="cartVariant">Size: ${item.size}</p>` : ""}
            
            <!-- নির্বাচিত Color দেখানো; না থাকলে লুকানো -->
            ${item.color ? `<p class="cartVariant">Color: ${item.color}</p>` : ""}
            
            <p class="cartPrice">
              ৳${price.toLocaleString()}
            </p>

          <div class="cartQuantity">

            <button
              onclick="changeCartQuantity('${item.id}', -1)"
            >
              −
            </button>

            <span>${quantity}</span>

            <button
              onclick="changeCartQuantity('${item.id}', 1)"
            >
              +
            </button>

          </div>

        </div>

        <div class="cartItemRight">

          <strong>
            ৳${itemTotal.toLocaleString()}
          </strong>

          <button
            class="deleteCart"
            onclick="removeFromCart('${item.id}')"
          >
            🗑️
          </button>

        </div>

      </div>
    `;
    
  }).join("");
  
  
  // Total section
  cartItems.innerHTML += `

    <div class="cartSummary">

      <div class="summaryRow">
        <span>Subtotal</span>
        <strong>
          ৳${subtotal.toLocaleString()}
        </strong>
      </div>

      <div class="summaryRow">
        <span>Delivery</span>
        <strong>
          ${
            deliveryCharge === 0
              ? "FREE"
              : "৳" + deliveryCharge
          }
        </strong>
      </div>

      ${
        subtotal < 2000
          ? `
            <p class="deliveryHint">
              Add ৳${(2000 - subtotal).toLocaleString()}
              more for FREE delivery 🎁
            </p>
          `
          : `
            <p class="freeDelivery">
              🎉 You got FREE delivery!
            </p>
          `
      }

      <div class="grandTotal">

        <span>Grand Total</span>

        <strong>
          ৳${grandTotal.toLocaleString()}
        </strong>

      </div>

    </div>

  `;
  
  
  if (totalElement) {
    totalElement.innerText =
      grandTotal.toLocaleString();
  }
};

function removeCart(index) {

  cart.splice(index, 1);

  updateCart();
}

async function openCart() {
  
  const user = window.shoporaAuth.currentUser;
  
  if (!user) {
    alert("Please login first.");
    return;
  }
  
  
  document
    .getElementById("cartPanel")
    .classList.add("active");
  
  
  await loadCart();
};

function closeCart() {

  document.getElementById("cartPanel")
    .classList.remove("active");
}

function searchProducts() {

  const text =
    document.getElementById("search")
      .value
      .toLowerCase();

  const result = products.filter(product =>
    product.name.toLowerCase().includes(text)
  );

  showProducts(result);
}

function filterCategory(category) {

  if (category === "All") {
    showProducts(products);
    return;
  }

  const result = products.filter(product =>
    product.category === category
  );

  showProducts(result);
}

function scrollProducts() {

  document.getElementById("products")
    .scrollIntoView({
      behavior: "smooth"
    });
}

function checkout() {
  
  if (cart.length === 0) {
    
    alert("Your cart is empty.");
    
    return;
  }
  
  
  let subtotal = 0;
  
  
  cart.forEach(item => {
    
    subtotal +=
      Number(item.price || 0) *
      Number(item.quantity || 1);
    
  });
  
  
  // পণ্যমূল্য অনুযায়ী delivery charge হিসাব
  const delivery = subtotal >= 2000 ? 0 : 60;

  // Apply করা coupon-এর discount হিসাব
  const discount = shoporaAppliedCoupon
    ? Math.min(
        Number(shoporaAppliedCoupon.discount) || 0,
        subtotal
      )
    : 0;

  // Discount বাদ দিয়ে চূড়ান্ত মোট দাম
  const grandTotal = subtotal - discount + delivery;
  
  
  // Summary তৈরি
  
  const summary =
    document.getElementById("checkoutSummary");
  
  
  summary.innerHTML = `

    <div class="checkoutSummaryBox">

      <div class="checkoutSummaryRow">
        <span>Items</span>
        <strong>${cart.length}</strong>
      </div>

      <div class="checkoutSummaryRow">
        <span>Subtotal</span>
        <strong>
          ৳${subtotal.toLocaleString()}
        </strong>
      </div>

      <div class="checkoutSummaryRow">
        <span>Delivery</span>
        <strong>
          ${
            delivery === 0
              ? "FREE"
              : "৳" + delivery
          }
        </strong>
      </div>

      <div class="checkoutGrandTotal">
        <span>Total</span>

        <strong>
          ৳${grandTotal.toLocaleString()}
        </strong>
      </div>

    </div>

  `;
  
  
  // User profile থাকলে নাম বসানোর চেষ্টা
  
  const user =
    window.shoporaAuth.currentUser;
  
  
  if (user) {
    
    const nameInput =
      document.getElementById("checkoutName");
    
    if (
      nameInput &&
      !nameInput.value &&
      user.displayName
    ) {
      nameInput.value =
        user.displayName;
    }
    
  }
  
  
  // Checkout open
  
  document
    .getElementById("checkoutScreen")
    .classList.add("active");
};
function closeCheckout() {
  
  document
    .getElementById("checkoutScreen")
    .classList.remove("active");
};

async function placeOrder() {

  const user =
    window.shoporaAuth.currentUser;


  if (!user) {

    alert("Please login first.");

    return;
  }


  if (cart.length === 0) {

    alert("Your cart is empty.");

    return;
  }


  // Get delivery information

  const name =
    document
      .getElementById("checkoutName")
      .value
      .trim();


  const phone =
    document
      .getElementById("checkoutPhone")
      .value
      .trim();


  const city =
    document
      .getElementById("checkoutCity")
      .value
      .trim();


  const address =
    document
      .getElementById("checkoutAddress")
      .value
      .trim();


  // Validation

  if (!name) {

    alert("Please enter your name.");

    return;
  }


  if (!phone) {

    alert("Please enter your phone number.");

    return;
  }


  if (!city) {

    alert("Please enter your city.");

    return;
  }


  if (!address) {

    alert("Please enter your delivery address.");

    return;
  };
  
    // =========================
    // PAYMENT METHOD
    // =========================
    
    // Selected payment option নিচ্ছি
    const paymentInput =
      document.querySelector(
        'input[name="paymentMethod"]:checked'
      );
    
    // Default হিসেবে COD
    const selectedPayment =
      paymentInput ?
      paymentInput.value :
      "cod";
    
    
    // Online payment এখনো চালু হয়নি
    if (selectedPayment === "online") {
      
      alert(
        "Online payment is coming soon. Please select Cash on Delivery."
      );
      
      return;
    }


  // Calculate total

  // পণ্যের মোট দাম হিসাব
let subtotal = 0;

cart.forEach(item => {
  subtotal +=
    Number(item.price || 0) *
    Number(item.quantity || 1);
});

// ডেলিভারি চার্জ
const delivery = subtotal >= 2000 ? 0 : 60;

// কুপন ছাড় ছাড়া সর্বমোট টাকা
const grandTotal = subtotal + delivery;

  try {
    // Debug: Check coupon and discount variables
console.log("Coupon value:", window.shoporaAppliedCoupon);
console.log("Coupon variable:", typeof shoporaAppliedCoupon);
console.log("Discount variable:", typeof discount);
console.log("Firebase save function:", typeof window.firebaseSetDoc);
    console.log("Creating order...");


    // Generate Firestore document ID

    const ordersCollection =
      window.firebaseCollection(
        window.shoporaDB,
        "orders"
      );


    const orderRef =
      window.firebaseDoc(
        ordersCollection
      );


    const orderId =
      orderRef.id;


    // Prepare products

    // DEBUG: অর্ডার দেওয়ার আগে Cart-এর তথ্য পরীক্ষা
console.log("CART BEFORE ORDER:", JSON.stringify(cart, null, 2));
// Order-এর জন্য Cart items প্রস্তুত করা
const orderItems = cart.map(item => ({
  // আসল Product ID
  productId: item.productId || item.id,

  // Cart-এর আলাদা Variant ID
  cartItemId: item.id,

  // পণ্যের তথ্য
  name: item.name,
  price: Number(item.price || 0),
  quantity: Number(item.quantity || 1),
  image: item.image || "",

  // ক্রেতার নির্বাচিত Size ও Color
  size: item.size || "",
  color: item.color || ""
}));

console.log("ORDER ITEMS:", JSON.stringify(orderItems, null, 2));


    // Save order

    await window.firebaseSetDoc(
      orderRef,
      {

        orderId: orderId,

        userId: user.uid,

        customer: {

          name: name,

          phone: phone,

          city: city,

          address: address

        },

        items: orderItems,

        subtotal: subtotal,
        // Order-এর সঙ্গে coupon ও discount সংরক্ষণ
        
        deliveryCharge: delivery,

        total: grandTotal,

        // =========================
        // PAYMENT INFORMATION
        // =========================
        
        // Selected payment method Firestore-এ save হবে
        paymentMethod:
          selectedPayment === "cod" ?
          "Cash on Delivery" :
          "Online Payment",
          
          // Payment এখনো সম্পন্ন হয়নি
          paymentStatus: "pending",

        orderStatus: "pending",

        createdAt:
          new Date().toISOString()

      }
    );


    console.log(
      "Order created:",
      orderId
    );


    // Delete cart items

    for (const item of cart) {

      const cartRef =
        window.firebaseDoc(
          window.shoporaDB,
          "users",
          user.uid,
          "cart",
          item.id
        );


      await window.firebaseDeleteDoc(
        cartRef
      );

    }

    
    // সফল Order-এর পর Cart খালি করা
    cart = [];
    updateCart();

    // আগের Coupon মুছে ফেলা
    shoporaAppliedCoupon = null;

    // Coupon input ও message পরিষ্কার করা
    const couponInput = document.getElementById("couponCode");
    const couponMessage = document.getElementById("couponMessage");
    const couponInfo = document.getElementById("appliedCouponInfo");

    if (couponInput) couponInput.value = "";
    if (couponMessage) couponMessage.textContent = "";
    if (couponInfo) {
      couponInfo.textContent = "";
      couponInfo.hidden = true;
    }

    // Checkout বন্ধ করা
    closeCheckout();


    // Show success

    document
      .getElementById("successOrderId")
      .innerText = orderId;


    document
      .getElementById("orderSuccess")
      .classList.add("active");


  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );


    alert(
      "Order could not be placed.\n\n" +
      (error?.message || "Unknown error")
    );

  }

};


showProducts();
updateCart();
let signupMode = false;

function showSignup() {
  
  signupMode = true;
  
  document.getElementById("authTitle").innerText =
    "Create Account ✨";
  
  document.getElementById("authSubtitle").innerText =
    "Join Shopora and start shopping";
  
  document.getElementById("nameInput").style.display =
    "block";
  
  document.querySelector(".authButton").innerText =
    "Sign Up";
  
  document.querySelector(".authButton").onclick =
    signupUser;
  
  document.querySelector(".switchAuth").innerHTML =
    `Already have an account?
     <span onclick="showLogin()">Login</span>`;
}

function showLogin() {
  
  signupMode = false;
  
  document.getElementById("authTitle").innerText =
    "Welcome Back 👋";
  
  document.getElementById("authSubtitle").innerText =
    "Login to continue shopping";
  
  document.getElementById("nameInput").style.display =
    "none";
  
  document.querySelector(".authButton").innerText =
    "Login";
  
  document.querySelector(".authButton").onclick =
    loginUser;
  
  document.querySelector(".switchAuth").innerHTML =
    `Don't have an account?
     <span onclick="showSignup()">Sign Up</span>`;
}

async function signupUser() {
  
  const name =
    document.getElementById("nameInput").value.trim();
  
  const email =
    document.getElementById("emailInput").value.trim();
  
  const password =
    document.getElementById("passwordInput").value;
  
  if (!name || !email || !password) {
    alert("Please fill all fields.");
    return;
  }
  
  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }
  
  try {
    
    const result =
      await window.firebaseCreateUser(
        window.shoporaAuth,
        email,
        password
      );
    
    alert("Account created successfully! 🎉");
    
    const user = result.user;

await window.firebaseSetDoc(
  window.firebaseDoc(
    window.shoporaDB,
    "users",
    user.uid
  ),
  {
    name: name,
    email: email,
    createdAt: new Date().toISOString()
  }
);
    
    enterShopora();
    
  } catch (error) {
    
    alert(getFirebaseError(error));
    
  }
}


async function loginUser() {
  
  const email =
    document.getElementById("emailInput").value.trim();
  
  const password =
    document.getElementById("passwordInput").value;
  
  if (!email || !password) {
    alert("Enter email and password.");
    return;
  }
  
  try {
    
    await window.firebaseLogin(
      window.shoporaAuth,
      email,
      password
    );
    
    alert("Login successful! 🎉");
    
    enterShopora();
    
  } catch (error) {
    
    alert(getFirebaseError(error));
    
  }
}
// ---------------------------------
// Firebase error message সুন্দরভাবে
// দেখানোর জন্য এই function ব্যবহার হবে
// ---------------------------------

function getFirebaseError(error) {

  switch (error.code) {

    case "auth/email-already-in-use":
      return "This email is already registered.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    case "auth/invalid-credential":
      return "Email or password is incorrect.";

    default:
      return error.message || "Something went wrong.";

  }
}


// =========================
// LOGIN USER
// =========================

async function loginUser() {

  // Email input নিচ্ছি
  const email =
    document.getElementById("emailInput").value.trim();

  // Password input নিচ্ছি
  const password =
    document.getElementById("passwordInput").value;


  // Empty field check
  if (!email || !password) {

    alert("Enter email and password.");

    return;
  }


  try {

    // Firebase Authentication দিয়ে login
    await window.firebaseLogin(
      window.shoporaAuth,
      email,
      password
    );

    console.log("LOGIN SUCCESSFUL ✅");

    // এখানে manually home page দেখানোর দরকার নেই।
    // Firebase onAuthStateChanged নিজে থেকেই
    // authScreen hide করবে।

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    alert(
      getFirebaseError(error)
    );

  }
}


// =========================
// SIGN UP USER
// =========================

async function signupUser() {

  // Name নিচ্ছি
  const name =
    document.getElementById("nameInput").value.trim();

  // Email নিচ্ছি
  const email =
    document.getElementById("emailInput").value.trim();

  // Password নিচ্ছি
  const password =
    document.getElementById("passwordInput").value;


  // সব field check
  if (!name || !email || !password) {

    alert("Please fill all fields.");

    return;
  }


  // Firebase minimum password length
  if (password.length < 6) {

    alert(
      "Password must be at least 6 characters."
    );

    return;
  }


  try {

    // Firebase account তৈরি
    const result =
      await window.firebaseCreateUser(
        window.shoporaAuth,
        email,
        password
      );


    // নতুন user
    const user = result.user;


    // Firestore users collection-এ
    // profile save করছি
    await window.firebaseSetDoc(

      window.firebaseDoc(
        window.shoporaDB,
        "users",
        user.uid
      ),

      {
        name: name,
        email: email,
        createdAt:
          new Date().toISOString()
      }

    );


    console.log(
      "ACCOUNT CREATED SUCCESSFULLY ✅"
    );


    alert(
      "Account created successfully! 🎉"
    );


    // Firebase signup-এর পর user
    // automatically logged in থাকে।
    // তাই আলাদা enterShopora() দরকার নেই।

  } catch (error) {

    console.error(
      "SIGNUP ERROR:",
      error
    );

    alert(
      getFirebaseError(error)
    );

  }
}


// =========================
// LOGOUT USER
// =========================

async function logoutUser() {

  try {

    // Firebase থেকে logout করছি
    await window.firebaseLogout(
      window.shoporaAuth
    );


    console.log(
      "LOGOUT SUCCESSFUL ✅"
    );


    // এখানে authScreen manually show করার দরকার নেই।
    //
    // Firebase logout হওয়ার পর
    // onAuthStateChanged automatically
    // authScreen show করবে।

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

    alert(
      "Logout failed. Please try again."
    );

  }
}

// =========================
// LOAD PROFILE DATA
// =========================

async function loadProfile() {
  
  // Current logged-in user
  const user =
    window.shoporaAuth.currentUser;
  
  
  // User login না করলে return
  if (!user) return;
  
  
  try {
    
    // Firebase users/userId document
    const profileRef =
      window.firebaseDoc(
        window.shoporaDB,
        "users",
        user.uid
      );
    
    
    // Firebase থেকে profile document নিচ্ছি
    const profile =
      await window.firebaseGetDoc(
        profileRef
      );
    
    
    // HTML-এর profile elements
    const nameElement =
      document.getElementById(
        "profileName"
      );
    
    
    const emailElement =
      document.getElementById(
        "profileEmail"
      );
    
    
    // Firebase profile পাওয়া গেলে
    if (profile.exists()) {
      
      const data =
        profile.data();
      
      
      // Name দেখাচ্ছি
      nameElement.innerText =
        data.name || "Shopora User";
      
      
      // Email দেখাচ্ছি
      emailElement.innerText =
        data.email || user.email;
      
    } else {
      
      // Profile document না থাকলে
      nameElement.innerText =
        "Shopora User";
      
      emailElement.innerText =
        user.email;
      
    }
    
    
  } catch (error) {
    
    console.error(
      "PROFILE ERROR:",
      error
    );
    
  }
};

loadProducts();
let selectedProduct = null;
let selectedQuantity = 1;


function openProductDetails(id) {
  
  selectedProduct =
    products.find(product => product.id === id);
  
  if (!selectedProduct) return;
  
  selectedQuantity = 1;
  
  document.getElementById("detailImage").src =
    selectedProduct.image || "";
  
  document.getElementById("detailName").innerText =
    selectedProduct.name;
  
  document.getElementById("detailPrice").innerText =
    Number(selectedProduct.price).toLocaleString();
  
  document.getElementById("detailCategory").innerText =
    "Category: " + selectedProduct.category;
  
  document.getElementById("detailDescription").innerText =
    selectedProduct.description ||
    "No description available.";
    
    
// পণ্যের Size অপশন দেখানো
const sizeSection = document.getElementById("detailSizeSection");
const sizeSelect = document.getElementById("detailSize");
const sizes = Array.isArray(selectedProduct.sizes)
  ? selectedProduct.sizes
  : [];

sizeSection.hidden = sizes.length === 0;
sizeSelect.innerHTML = '<option value="">Size নির্বাচন করুন</option>';

sizes.forEach(size => {
  const option = document.createElement("option");
  option.value = size;
  option.textContent = size;
  sizeSelect.appendChild(option);
});

// পণ্যের Color অপশন দেখানো
const colorSection = document.getElementById("detailColorSection");
const colorSelect = document.getElementById("detailColor");
const colors = Array.isArray(selectedProduct.colors)
  ? selectedProduct.colors
  : [];

colorSection.hidden = colors.length === 0;
colorSelect.innerHTML = '<option value="">Color নির্বাচন করুন</option>';

colors.forEach(color => {
  const option = document.createElement("option");
  option.value = color;
  option.textContent = color;
  colorSelect.appendChild(option);
});

  
  document.getElementById("quantity").innerText =
    selectedQuantity;
  
  document.getElementById("productDetails")
    .classList.add("active");
    // Wishlist button-এর অবস্থাও update করা
    updateDetailWishlistButton();
    // Product Details খুললে ওই product-এর reviews load করবে
    loadProductReviews(selectedProduct.id);
}


function closeProductDetails() {
  
  document.getElementById("productDetails")
    .classList.remove("active");
  
}


function changeQuantity(amount) {
  
  if (!selectedProduct) return;
  
  selectedQuantity += amount;
  
  if (selectedQuantity < 1) {
    selectedQuantity = 1;
  }
  
  if (
    selectedProduct.stock &&
    selectedQuantity > selectedProduct.stock
  ) {
    selectedQuantity = selectedProduct.stock;
  }
  
  document.getElementById("quantity").innerText =
    selectedQuantity;
};
async function addDetailToCart() {
  
  if (!selectedProduct) return;
  
  await addToCart(
    selectedProduct.id,
    selectedQuantity
  );
  
  closeProductDetails();
};


// ========================================
// UPDATE CART QUANTITY FOR A SPECIFIC VARIANT
// ========================================
async function changeCartQuantity(id, amount) {
  const user = window.shoporaAuth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  // Cart-এর নির্দিষ্ট item খোঁজা
  const item = cart.find(product => product.id === id);
  if (!item) return;

  const newQuantity = Number(item.quantity || 1) + amount;

  // Quantity 0 হলে শুধু এই Cart item মুছে ফেলা
  if (newQuantity <= 0) {
    await removeFromCart(id);
    return;
  }

  // Variant ID নয়, আসল productId দিয়ে Stock খোঁজা
  const product = products.find(
    product => product.id === item.productId
  );

  if (
    product &&
    newQuantity > Number(product.stock ?? 0)
  ) {
    alert(`Only ${product.stock} items available.`);
    return;
  }

  try {
    // Firestore-এ এই Variant-এর Cart document খোঁজা
    const cartRef = window.firebaseDoc(
      window.shoporaDB,
      "users",
      user.uid,
      "cart",
      id
    );

    // Quantity আপডেট; Size ও Color অক্ষত থাকবে
    await window.firebaseSetDoc(
      cartRef,
      {
        ...item,
        quantity: newQuantity
      }
    );

    await loadCart();
  } catch (error) {
    console.error("Quantity update error:", error);
    alert("Could not update quantity.");
  }
}


async function removeFromCart(id) {
  
  const user = window.shoporaAuth.currentUser;
  
  if (!user) return;
  
  
  try {
    
    const cartRef = window.firebaseDoc(
      window.shoporaDB,
      "users",
      user.uid,
      "cart",
      id
    );
    
    
    await window.firebaseDeleteDoc(cartRef);
    
    
    await loadCart();
    
    
  } catch (error) {
    
    console.error(
      "Delete cart error:",
      error
    );
    
    alert(
      "Could not remove item."
    );
  }
};

function checkout() {
  
  console.log("CHECKOUT CLICKED");
  
  if (!cart || cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }
  
  // পণ্যের মোট দাম হিসাব করা
let subtotal = 0;

cart.forEach(item => {
  subtotal +=
    Number(item.price || 0) *
    Number(item.quantity || 1);
});

// ডেলিভারি চার্জ হিসাব করা
const delivery = subtotal >= 2000 ? 0 : 60;

// কুপন থাকলে ছাড় হিসাব করা, না থাকলে ০
const discount = shoporaAppliedCoupon ?
  Math.min(
    Number(shoporaAppliedCoupon.discount) || 0,
    subtotal
  ) :
  0;

// ছাড় ও ডেলিভারি যোগ করে মোট টাকা হিসাব
const grandTotal = subtotal - discount + delivery;
  
  
  const summary =
    document.getElementById("checkoutSummary");
  
  
  if (!summary) {
    
    alert(
      "Checkout screen পাওয়া যাচ্ছে না।"
    );
    
    console.error(
      "checkoutSummary element missing"
    );
    
    return;
  }
  
  
  summary.innerHTML = `

    <div class="checkoutSummaryBox">

      <div class="checkoutSummaryRow">
        <span>Items</span>
        <strong>${cart.length}</strong>
      </div>

      <div class="checkoutSummaryRow">
        <span>Subtotal</span>
        <strong>
          ৳${subtotal.toLocaleString()}
        </strong>
      </div>

      <div class="checkoutSummaryRow">
        <span>Delivery</span>
        <strong>
          ${
            delivery === 0
              ? "FREE"
              : "৳" + delivery
          }
        </strong>
      </div>

      <div class="checkoutGrandTotal">
        <span>Grand Total</span>

        <strong>
          ৳${grandTotal.toLocaleString()}
        </strong>
      </div>

    </div>

  `;
  
  
  const screen =
    document.getElementById("checkoutScreen");
  
  
  if (!screen) {
    
    alert(
      "Checkout screen HTML missing."
    );
    
    console.error(
      "checkoutScreen element missing"
    );
    
    return;
  }
  
  
  screen.classList.add("active");
  
  console.log(
    "Checkout screen opened"
  );
};

function closeOrderSuccess() {
  
  document
    .getElementById("orderSuccess")
    .classList.remove("active");
  
};

// =========================
// MY ORDERS OPEN
// =========================

// এই function My Orders screen খুলবে
// =========================
// OPEN MY ORDERS
// =========================

async function openOrders() {
  
  // Console-এ দেখাবে function সত্যিই চলছে কি না
  console.log("OPEN ORDERS CLICKED");
  
  // বর্তমানে login করা user
  const user =
    window.shoporaAuth.currentUser;
  
  // Login করা না থাকলে Orders খুলব না
  if (!user) {
    alert("Please login first.");
    return;
  }
  
  // My Orders popup খুলছি
  const ordersScreen =
    document.getElementById("ordersScreen");
  
  if (!ordersScreen) {
    console.error("ordersScreen not found!");
    return;
  }
  
  ordersScreen.classList.add("active");
  
  console.log("ORDERS SCREEN OPENED");
  
  // Orders load করার function অবশ্যই call করছি
  await loadOrders();
  
  console.log("LOAD ORDERS FINISHED");
}


// =========================
// CLOSE MY ORDERS
// =========================

function closeOrders() {
  
  // Orders popup বন্ধ করছি
  const ordersScreen =
    document.getElementById("ordersScreen");
  
  if (ordersScreen) {
    ordersScreen.classList.remove("active");
  }
}


// =========================
// MY ORDERS CLOSE
// =========================

// এই function Orders screen বন্ধ করবে
function closeOrders() {
  
  document
    .getElementById("ordersScreen")
    .classList.remove("active");
};


// =========================
// LOAD MY ORDERS FROM FIREBASE
// =========================

async function loadOrders() {
  
  // বর্তমানে login করা user বের করছি
  const user =
    window.shoporaAuth.currentUser;
  
  console.log("MY ORDERS FUNCTION STARTED");
  
  // Login করা না থাকলে থামব
  if (!user) {
    console.log("NO USER LOGGED IN");
    return;
  }
  
  // Orders দেখানোর container
  const ordersList =
    document.getElementById("ordersList");
  
  // প্রথমে loading দেখাচ্ছি
  ordersList.innerHTML = `
    <div class="ordersLoading">
      Loading orders... ⏳
    </div>
  `;
  
  try {
    
    // =========================
    // ORDERS COLLECTION
    // =========================
    
    const ordersRef =
      window.firebaseCollection(
        window.shoporaDB,
        "orders"
      );
    
    console.log("Orders collection ready");
    
    
    // =========================
    // ONLY CURRENT USER'S ORDERS
    // =========================
    
    const myOrdersQuery =
      window.firebaseQuery(
        ordersRef,
        window.firebaseWhere(
          "userId",
          "==",
          user.uid
        )
      );
    
    console.log("User order query ready");
    
    
    // Firebase থেকে শুধু এই user-এর orders নিচ্ছি
    const snapshot =
      await window.firebaseGetDocs(
        myOrdersQuery
      );
    
    console.log(
      "Firestore response received"
    );
    
    
    // Orders রাখার array
    let myOrders = [];
    
    
    // =========================
    // READ ORDERS
    // =========================
    
    snapshot.forEach(item => {
      
      // Firestore document data
      const data = item.data();
      
      console.log(
        "Order found:",
        data
      );
      
      myOrders.push({
        id: item.id,
        ...data
      });
      
    });
    
    
    console.log(
      "Total orders:",
      myOrders.length
    );
    
    
    // =========================
    // NO ORDERS
    // =========================
    
    if (myOrders.length === 0) {
      
      ordersList.innerHTML = `
        <div class="emptyOrders">

          <div class="emptyOrdersIcon">
            📦
          </div>

          <h3>No orders yet</h3>

          <p>
            Your orders will appear here.
          </p>

        </div>
      `;
      
      return;
    }
    
    
    // =========================
    // SHOW ORDERS
    // =========================
    
    ordersList.innerHTML =
      myOrders.map(order => {
        
        // Order date তৈরি করছি
        const orderDate =
          order.createdAt ?
          new Date(
            order.createdAt
          ).toLocaleString() :
          "Date unavailable";
        
        // Admin Panel-এ পাওয়া Order-এর items পরীক্ষা
        console.log("ADMIN ORDER ITEMS:", order.items);
        // Order-এর products
        const items =
          (order.items || [])
          .map(item => {
            
            return `
              <div class="orderProduct">

                <img
                  src="${item.image || ""}"
                  alt="${item.name || "Product"}"
                >

                <div class="orderProductInfo">

                   <h4>
                    ${item.name || "Product"}
                  </h4>

                 
                <!-- নির্বাচিত Size ও Color দেখানো -->
                ${item.size ? `
                  <p class="orderProductVariant">
                    Size: ${item.size}
                  </p>
                ` : ""}
                
                ${item.color ? `
                  <p class="orderProductVariant">
                    Color: ${item.color}
                  </p>
                ` : ""}
                
                <p>
                  Qty: ${item.quantity || 1}
                  ×
                  ৳${Number(item.price || 0).toLocaleString()}
                </p>


                </div>

              </div>
            `;
            
          })
          .join("");
        
        
        // সম্পূর্ণ order card
        return `
          <div class="orderCard">

            <div class="orderId">
              Order ID: ${order.id}
            </div>

            ${items}

            <div class="orderTotal">
              Total:
              ৳${Number(
                order.total || 0
              ).toLocaleString()}
            </div>

            <span class="orderStatus">
              ${order.orderStatus || "pending"}
            </span>
            <!-- ========================================
               ORDER TRACKING TIMELINE
               ======================================== -->
          
            <div class="orderTracking">
          
            <!-- Pending -->
            <div class="trackingStep ${
              ["pending", "confirmed", "shipped", "delivered"]
                .includes(order.orderStatus || "pending")
                ? "active"
                : ""
            }">
          
              <div class="trackingIcon">
                📦
              </div>
          
              <div class="trackingText">
                <strong>Order Placed</strong>
                <span>Your order has been placed</span>
              </div>
          
            </div>
          
          
            <!-- Confirmed -->
            <div class="trackingStep ${
              ["confirmed", "shipped", "delivered"]
                .includes(order.orderStatus)
                ? "active"
                : ""
            }">
          
              <div class="trackingIcon">
                ✅
              </div>
          
              <div class="trackingText">
                <strong>Confirmed</strong>
                <span>Your order has been confirmed</span>
              </div>
          
            </div>
          
          
            <!-- Shipped -->
            <div class="trackingStep ${
              ["shipped", "delivered"]
                .includes(order.orderStatus)
                ? "active"
                : ""
            }">
          
              <div class="trackingIcon">
                🚚
              </div>
          
              <div class="trackingText">
                <strong>Shipped</strong>
                <span>Your order is on the way</span>
              </div>
          
            </div>
          
          
            <!-- Delivered -->
            <div class="trackingStep ${
              order.orderStatus === "delivered"
                ? "active"
                : ""
            }">
          
              <div class="trackingIcon">
                🎉
              </div>
          
              <div class="trackingText">
                <strong>Delivered</strong>
                <span>Your order has been delivered</span>
              </div>
          
            </div>
          
          </div>
            
            <!-- =========================
                 PAYMENT STATUS
            ========================= -->
            
            <div class="customerPaymentStatus">
            
              <span class="paymentLabel">
                💳 Payment
              </span>
            
              <span class="paymentValue">
            
                ${
                  order.paymentStatus === "paid"
                    ? "✅ Paid"
                    : order.paymentStatus === "failed"
                      ? "❌ Failed"
                      : "⏳ Pending"
                }
            
              </span>
            
            </div>
            
            <!-- Payment Status -->
            <div class="paymentStatusBadge">
            
              💵
            
              ${
                order.paymentStatus === "paid"
                  ? "Paid"
                  : "Payment Pending"
              }
            
            </div>

            <div class="orderDate">
              ${orderDate}
            </div>

          </div>
        `;
        
      }).join("");
    
    
    console.log(
      "ORDERS DISPLAYED SUCCESSFULLY"
    );
    
  } catch (error) {
    
    // Error console-এ দেখাচ্ছি
    console.error(
      "MY ORDERS ERROR:",
      error
    );
    
    // Error হলে loading সরিয়ে message দেখাচ্ছি
    ordersList.innerHTML = `
      <div class="emptyOrders">

        <h3>
          Could not load orders 😔
        </h3>

        <p>
          ${error?.message || "Unknown error"}
        </p>

      </div>
    `;
  }
};

// ========================================
// OPEN PREMIUM PROFILE
// ========================================

function openProfile() {
  
  console.log("PROFILE CLICKED ✅");
  
  // বর্তমানে login করা user
  const user =
    window.shoporaAuth.currentUser;
  
  // Login না থাকলে Profile খুলব না
  if (!user) {
    
    alert("Please login first.");
    
    return;
  }
  
  // Profile element খুঁজছি
  const profilePage =
    document.getElementById("profilePage");
  
  // Profile না পাওয়া গেলে error দেখাবে
  if (!profilePage) {
    
    console.error(
      "profilePage পাওয়া যায়নি!"
    );
    
    return;
  }
  
  // =========================
  // অন্য page hide
  // =========================
  
  const homePage =
    document.getElementById("homePage");
  
  if (homePage) {
    homePage.style.display = "none";
  }
  
  const shopPage =
    document.getElementById("shopPage");
  
  if (shopPage) {
    shopPage.style.display = "none";
  }
  
  const cartPage =
    document.getElementById("cartPage");
  
  if (cartPage) {
    cartPage.style.display = "none";
  }
  
  // =========================
  // PROFILE SHOW
  // =========================
  
  profilePage.style.display = "block";
  
  // Slide animation চালু করছি
  setTimeout(() => {
    
    profilePage.classList.add(
      "profileOpen"
    );
    
  }, 20);
  
  // Profile information load
  loadProfile();
  
  console.log(
    "PROFILE OPENED ✅"
  );
}


// ========================================
// CLOSE PROFILE
// ========================================

function closeProfile() {
  
  console.log(
    "PROFILE CLOSED"
  );
  
  const profilePage =
    document.getElementById("profilePage");
  
  if (!profilePage) return;
  
  // Animation reverse
  profilePage.classList.remove(
    "profileOpen"
  );
  
  // Animation শেষ হলে hide
  setTimeout(() => {
    
    profilePage.style.display = "none";
    
    // Home আবার দেখাচ্ছি
    const homePage =
      document.getElementById("homePage");
    
    if (homePage) {
      homePage.style.display = "block";
    }
    
  }, 400);
}

// =========================
// CHECK ADMIN USER
// =========================

async function checkAdmin() {
  
  // বর্তমানে login করা user
  const user =
    window.shoporaAuth.currentUser;
  
  // Login করা না থাকলে Admin নয়
  if (!user) {
    console.log("No user logged in.");
    return false;
  }
  
  try {
    
    // admins/{user.uid} document
    const adminRef =
      window.firebaseDoc(
        window.shoporaDB,
        "admins",
        user.uid
      );
    
    // Firebase থেকে admin document নিচ্ছি
    const adminDoc =
      await window.firebaseGetDoc(
        adminRef
      );
    
    // Document না থাকলে Admin নয়
    if (!adminDoc.exists()) {
      
      console.log("User is NOT admin.");
      
      return false;
    }
    
    // Admin data
    const adminData=
      adminDoc.data();
    
    // role পরীক্ষা করছি
    if (adminData.role === "admin") {
      
      console.log("User IS ADMIN ✅");
      
      return true;
    }
    
    // Role admin না হলে
    console.log("User is NOT admin.");
    
    return false;
    
  } catch (error) {
    
    // Error console-এ দেখাচ্ছি
    console.error(
      "ADMIN CHECK ERROR:",
      error
    );
    
    return false;
  }
};


// =========================
// OPEN ADMIN PANEL
// =========================

// =========================
// OPEN ADMIN PANEL
// =========================

async function openAdminPanel() {
  
  // Admin কিনা পরীক্ষা করছি
  const isAdmin =
    await checkAdmin();
  
  // Admin না হলে বন্ধ
  if (!isAdmin) {
    
    alert(
      "Access denied. Admin only."
    );
    
    return;
  }
  
  
  // Admin panel খুলছি
  document
    .getElementById("adminPanel")
    .classList.add("active");
  
  
  // Firebase থেকে orders load করছি
  await loadAdminOrders();
  // Admin-এর product list load করা
  await loadAdminProducts();
  
  
  console.log(
    "ADMIN PANEL OPENED ✅"
  );
}

// =========================
// CLOSE ADMIN PANEL
// =========================

function closeAdminPanel() {
  
  document
    .getElementById("adminPanel")
    .classList.remove("active");
};


// =========================
// LOAD ALL ORDERS FOR ADMIN
// =========================

async function loadAdminOrders() {
  
  console.log("ADMIN ORDERS LOADING...");
  
  // Orders দেখানোর জায়গা
  const ordersList =
    document.getElementById("adminOrdersList");
  
  if (!ordersList) {
    console.error("adminOrdersList পাওয়া যায়নি!");
    return;
  }
  
  // Loading message
  ordersList.innerHTML = `
    <div class="ordersLoading">
      Loading all orders... ⏳
    </div>
  `;
  
  try {
    
    // =========================
    // CHECK ADMIN
    // =========================
    
    const isAdmin =
      await checkAdmin();
    
    if (!isAdmin) {
      ordersList.innerHTML = `
        <div class="emptyOrders">
          Access denied ❌
        </div>
      `;
      return;
    }
    
    
    // =========================
    // GET ORDERS COLLECTION
    // =========================
    
    const ordersRef =
      window.firebaseCollection(
        window.shoporaDB,
        "orders"
      );
    
    
    // Firebase থেকে সব orders নিচ্ছি
    const snapshot =
      await window.firebaseGetDocs(
        ordersRef
      );
    
    
    let allOrders = [];
    
    
    // =========================
    // READ ORDERS
    // =========================
    
    snapshot.forEach(item => {
      
      const data =
        item.data();
      
      allOrders.push({
        id: item.id,
        ...data
      });
      
    });
    
    
    console.log(
      "TOTAL ADMIN ORDERS:",
      allOrders.length
    );
    
    
    // =========================
    // UPDATE STATISTICS
    // =========================
    
    document.getElementById("totalOrders").innerText =
      allOrders.length;
    
    document.getElementById("pendingOrders").innerText =
      allOrders.filter(
        order => order.orderStatus === "pending"
      ).length;
    
    document.getElementById("shippedOrders").innerText =
      allOrders.filter(
        order => order.orderStatus === "shipped"
      ).length;
    
    document.getElementById("deliveredOrders").innerText =
      allOrders.filter(
        order => order.orderStatus === "delivered"
      ).length;
    
    
    // =========================
    // NO ORDERS
    // =========================
    
    if (allOrders.length === 0) {
      
      ordersList.innerHTML = `
        <div class="emptyOrders">

          <div class="emptyOrdersIcon">
            📦
          </div>

          <h3>No orders yet</h3>

          <p>
            Customer orders will appear here.
          </p>

        </div>
      `;
      
      return;
    }
    
    
    // =========================
    // SHOW ALL ORDERS
    // =========================
    
    ordersList.innerHTML =
      allOrders.map(order => {
        
        const orderDate =
          order.createdAt ?
          new Date(
            order.createdAt
          ).toLocaleString() :
          "Date unavailable";
        
        
        // Customer information
        const customer =
          order.customer || {};
        
        
        // Products
        const items =
          (order.items || [])
          .map(item => {
            
            return `
              <div class="orderProduct">

                <img
                  src="${item.image || ""}"
                  alt="${item.name || "Product"}"
                >

                <div class="orderProductInfo">

                  <h4>
                    ${item.name || "Product"}
                  </h4>

                  <p>
                    Qty: ${item.quantity || 1}
                    ×
                    ৳${Number(
                      item.price || 0
                    ).toLocaleString()}
                  </p>

                </div>

              </div>
            `;
            
          })
          .join("");
        
        
        // =========================
        // ADMIN ORDER CARD
        // =========================

      return `
        <div class="orderCard">

          <!-- Order ID -->
         <div class="orderId">
           Order ID: ${order.id}
         </div>


            <!-- Customer information -->
            <p>
              👤 <b>${customer.name || "Unknown"}</b>
            </p>
        
            <p>
              📞 ${customer.phone || "No phone"}
            </p>
        
            <p>
              📍 ${customer.city || ""}
              ${customer.address || ""}
            </p>
        
        
            <!-- Products -->
            ${items}
        
        
            <!-- Total -->
            <div class="orderTotal">
              Total:
              ৳${Number(
                order.total || 0
              ).toLocaleString()}
            </div>
        
              <!-- =========================
                   ORDER STATUS
              ========================= -->
              
              <div class="adminStatusBox">
              
                <label>
                  Order Status
                </label>
              
                <select
                  onchange="updateOrderStatus(
                    '${order.id}',
                    this.value
                  )"
                >
              
                  <option
                    value="pending"
                    ${
                      order.orderStatus === "pending"
                        ? "selected"
                        : ""
                    }
                  >
                    Pending
                  </option>
              
                  <option
                    value="confirmed"
                    ${
                      order.orderStatus === "confirmed"
                        ? "selected"
                        : ""
                    }
                  >
                    Confirmed
                  </option>
              
                  <option
                    value="shipped"
                    ${
                      order.orderStatus === "shipped"
                        ? "selected"
                        : ""
                    }
                  >
                    Shipped
                  </option>
              
                  <option
                    value="delivered"
                    ${
                      order.orderStatus === "delivered"
                        ? "selected"
                        : ""
                    }
                  >
                    Delivered
                  </option>
              
                </select>
              
              </div>
              
              
              <!-- =========================
                   PAYMENT STATUS
              ========================= -->
              
              <div class="adminPaymentBox">
              
                <label>
                  Payment Status
                </label>
              
                <select
                  onchange="updatePaymentStatus(
                    '${order.id}',
                    this.value
                  )"
                >
              
                  <option
                    value="pending"
                    ${
                      order.paymentStatus === "pending"
                        ? "selected"
                        : ""
                    }
                  >
                    Pending
                  </option>
              
                  <option
                    value="paid"
                    ${
                      order.paymentStatus === "paid"
                        ? "selected"
                        : ""
                    }
                  >
                    Paid
                  </option>
              
                  <option
                    value="failed"
                    ${
                      order.paymentStatus === "failed"
                        ? "selected"
                        : ""
                    }
                  >
                    Failed
                  </option>
              
                </select>
              
              </div>
                
            <!-- Order date -->
            <div class="orderDate">
              ${orderDate}
            </div>
        
          </div>
        `;
                
      }).join("");
    
    
    console.log(
      "ADMIN ORDERS DISPLAYED ✅"
    );
    
    
  } catch (error) {
    
    console.error(
      "ADMIN ORDERS ERROR:",
      error
    );
    
    ordersList.innerHTML = `
      <div class="emptyOrders">

        <h3>
          Could not load orders 😔
        </h3>

        <p>
          ${error?.message || "Unknown error"}
        </p>

      </div>
    `;
    
  }
};

// =========================
// UPDATE ORDER STATUS
// =========================

async function updateOrderStatus(
  orderId,
  newStatus
) {
  
  console.log(
    "Updating order:",
    orderId,
    newStatus
  );
  
  
  // -------------------------
  // Current user
  // -------------------------
  
  const user =
    window.shoporaAuth.currentUser;
  
  
  // Login check
  if (!user) {
    
    alert(
      "Please login first."
    );
    
    return;
  }
  
  
  try {
    
    // -------------------------
    // Admin check
    // -------------------------
    
    const isAdmin =
      await checkAdmin();
    
    
    if (!isAdmin) {
      
      alert(
        "Access denied. Admin only."
      );
      
      return;
    }
    
    
    // -------------------------
    // Order reference
    // -------------------------
    
    const orderRef =
      window.firebaseDoc(
        window.shoporaDB,
        "orders",
        orderId
      );
    
    
    // -------------------------
    // Update status
    // -------------------------
    
    // Read order details first
    const orderSnapshot =
      await window.firebaseGetDoc(orderRef);
    
    if (!orderSnapshot.exists()) {
      alert("Order not found.");
      return;
    }
    
    const orderData = orderSnapshot.data();
    
    // Update order status
    await window.firebaseSetDoc(
      orderRef,
      {
        orderStatus: newStatus
      },
      {
        merge: true
      }
    );
    
    // Create notification for the customer
    if (orderData.userId) {
      const notificationRef =
        window.firebaseCollection(
          window.shoporaDB,
          "users",
          orderData.userId,
          "notifications"
        );
    
      const notificationDoc =
        window.firebaseDoc(notificationRef);
    
      const statusMessages = {
        pending: "Your order is pending confirmation.",
        confirmed: "Your order has been confirmed!",
        shipped: "Your order has been shipped!",
        delivered: "Your order has been delivered successfully!"
      };
    
      await window.firebaseSetDoc(
        notificationDoc,
        {
          title: "Order Status Updated",
          message:
            statusMessages[newStatus] ||
            "Your order status is now " + newStatus + ".",
          orderId: orderId,
          status: newStatus,
          read: false,
          createdAt: new Date().toISOString()
        }
      );
    }
    
    console.log("ORDER STATUS AND NOTIFICATION UPDATED");
        
        
    console.log(
      "ORDER STATUS UPDATED ✅"
    );
    
    
    alert(
      "Order status updated successfully! ✅"
    );
    
    
    // -------------------------
    // Admin orders refresh
    // -------------------------
    
    await loadAdminOrders();
    
    
  } catch (error) {
    
    console.error(
      "ORDER STATUS UPDATE ERROR:",
      error
    );
    
    
    alert(
      "Could not update order status.\n\n" +
      (
        error?.message ||
        "Unknown error"
      )
    );
    
  }
};

// ========================================
// UPDATE PAYMENT STATUS
// ========================================

async function updatePaymentStatus(
  orderId,
  newPaymentStatus
) {

  // Console-এ update information দেখাবে
  console.log(
    "Updating payment status:",
    orderId,
    newPaymentStatus
  );


  // বর্তমানে login করা user
  const user =
    window.shoporaAuth.currentUser;


  // Login না থাকলে বন্ধ
  if (!user) {

    alert("Please login first.");

    return;
  }


  try {

    // =========================
    // CHECK ADMIN
    // =========================

    const isAdmin =
      await checkAdmin();


    // Admin না হলে update করতে পারবে না
    if (!isAdmin) {

      alert(
        "Access denied. Admin only."
      );

      return;
    }


    // =========================
    // ORDER REFERENCE
    // =========================

    const orderRef =
      window.firebaseDoc(
        window.shoporaDB,
        "orders",
        orderId
      );


    // =========================
    // UPDATE FIRESTORE
    // =========================

    await window.firebaseSetDoc(
      orderRef,
      {

        paymentStatus:
          newPaymentStatus

      },

      {
        merge: true
      }
    );


    console.log(
      "PAYMENT STATUS UPDATED ✅"
    );


    alert(
      "Payment status updated successfully! ✅"
    );


    // Admin orders আবার load করা
    await loadAdminOrders();


  } catch (error) {

    console.error(
      "PAYMENT STATUS UPDATE ERROR:",
      error
    );


    alert(
      "Could not update payment status.\n\n" +
      (
        error?.message ||
        "Unknown error"
      )
    );

  }

}

// ========================================
// LOAD WISHLIST
// ========================================

async function loadWishlist() {
  
  // বর্তমানে login করা user
  const user =
    window.shoporaAuth.currentUser;
  
  // Login না থাকলে wishlist empty
  if (!user) {
    
    wishlist = [];
    
    return;
  }
  
  try {
    
    // User-এর wishlist collection
    const wishlistCollection =
      window.firebaseCollection(
        window.shoporaDB,
        "users",
        user.uid,
        "wishlist"
      );
    
    // Firestore থেকে wishlist পড়া
    const snapshot =
      await window.firebaseGetDocs(
        wishlistCollection
      );
    
    // Wishlist array তৈরি
    wishlist = [];
    
    snapshot.forEach(docSnap => {
      
      wishlist.push({
        id: docSnap.id,
        ...docSnap.data()
      });
      
    });
    
    console.log(
      "WISHLIST LOADED ❤️",
      wishlist
    );
    // Wishlist load হওয়ার পর product cards refresh করা
    if (typeof showProducts === "function") {
    showProducts();
    }
    
  } catch (error) {
    
    console.error(
      "WISHLIST LOAD ERROR:",
      error
    );
    
  }
};

// ========================================
// TOGGLE WISHLIST
// ========================================

async function toggleWishlist(productId) {

  // Login করা user
  const user =
    window.shoporaAuth.currentUser;

  // Login না থাকলে
  if (!user) {

    alert(
      "Please login to use Wishlist."
    );

    return;
  }

  try {

    // Product খুঁজে বের করা
    const product =
      products.find(
        item =>
          item.id === productId
      );

    // Product পাওয়া না গেলে
    if (!product) {

      alert("Product not found.");

      return;
    }


    // Wishlist document reference
    const wishlistRef =
      window.firebaseDoc(
        window.shoporaDB,
        "users",
        user.uid,
        "wishlist",
        productId
      );


    // আগে wishlist-এ আছে কিনা
    const existing =
      wishlist.find(
        item =>
          item.id === productId
      );


    // ========================================
    // REMOVE FROM WISHLIST
    // ========================================
    
    if (existing) {
      
      // Wishlist card খুঁজে বের করা
      const cards =
        document.querySelectorAll(
          ".wishlistProduct"
        );
      
      // যে product remove হবে তার card-এ animation দেওয়া
      cards.forEach(card => {
        
        const removeButton =
          card.querySelector(
            "button:last-child"
          );
        
        // Product ID মিলিয়ে card শনাক্ত করা
        if (
          removeButton &&
          removeButton.getAttribute("onclick")?.includes(productId)
        ) {
          
          // Remove animation শুরু
          card.classList.add("removing");
          
        }
      });
      
      
      // Animation শেষ হওয়ার জন্য একটু অপেক্ষা
      await new Promise(resolve => {
        setTimeout(resolve, 350);
      });
      
      
      // Firestore থেকে wishlist item delete
      await window.firebaseDeleteDoc(
        wishlistRef
      );
      
      
      // Local wishlist থেকেও remove
      wishlist =
        wishlist.filter(
          item =>
          item.id !== productId
        );
      
      
      console.log(
        "REMOVED FROM WISHLIST ❤️"
      );
    }

    // =========================
    // ADD
    // =========================

    else {

      await window.firebaseSetDoc(
        wishlistRef,
        {

          productId:
            product.id,

          name:
            product.name,

          price:
            Number(product.price || 0),

          image:
            product.image || "",

          category:
            product.category || "",

          addedAt:
            new Date().toISOString()

        }
      );


      // Local wishlist update
      wishlist.push({

        id:
          product.id,

        productId:
          product.id,

        name:
          product.name,

        price:
          Number(product.price || 0),

        image:
          product.image || "",

        category:
          product.category || ""

      });


      console.log(
        "ADDED TO WISHLIST ❤️"
      );

    }


    // Product list refresh
    showProducts();
    // Wishlist screen খোলা থাকলে নতুন list দেখাবে
    if (document.getElementById("wishlistScreen")) {
    renderWishlist();
    }

  } catch (error) {

    console.error(
      "WISHLIST ERROR:",
      error
    );

    alert(
      "Wishlist update failed.\n\n" +
      (
        error?.message ||
        "Unknown error"
      )
    );

  }
};

// ========================================
// OPEN WISHLIST
// ========================================

function openWishlist() {
  
  // Profile বন্ধ করা
  closeProfile();
  
  // Wishlist screen
  const wishlistScreen =
    document.getElementById("wishlistScreen");
  
  if (wishlistScreen) {
    
    // Wishlist screen দেখানো
    wishlistScreen.style.display = "block";
    
    // Opening animation
    setTimeout(() => {
      
      wishlistScreen.classList.add(
        "wishlistActive"
      );
      
    }, 10);
  }
  
  // Wishlist products দেখানো
  renderWishlist();
}

// ========================================
// CLOSE WISHLIST
// ========================================

function closeWishlist() {
  
  // Wishlist screen খুঁজে বের করা
  const wishlistScreen =
    document.getElementById("wishlistScreen");
  
  // Wishlist closing animation
  if (wishlistScreen) {
    
    wishlistScreen.classList.remove(
      "wishlistActive"
    );
    
    // Animation শেষ হওয়ার পর screen hide
    setTimeout(() => {
      
      wishlistScreen.style.display = "none";
      
      // Wishlist বন্ধ হলে Profile আবার দেখানো
      openProfile();
      
    }, 350);
  }
}

// ========================================
// SHOW WISHLIST PRODUCTS
// ========================================

function renderWishlist() {
  
  // Wishlist container
  const box =
    document.getElementById("wishlistItems");
  
  // Container না পাওয়া গেলে function বন্ধ
  if (!box) {
    return;
  }
  
  // পুরোনো items পরিষ্কার করা
  box.innerHTML = "";
  
  if (wishlist.length === 0) {
  
  // সুন্দর empty wishlist screen
  box.innerHTML = `

    <div class="wishlistEmpty">

      <!-- Heart icon -->
      <div class="wishlistEmptyIcon">
        ❤️
      </div>

      <!-- Main title -->
      <h3>
        Your Wishlist is Empty
      </h3>

      <!-- Description -->
      <p>
        Save products you love and
        find them here later.
      </p>

      <!-- Start shopping button -->
      <button
        onclick="closeWishlist(); scrollProducts();"
        class="wishlistShopButton"
      >
        🛍️ Start Shopping
      </button>

    </div>

  `;
  
  return;
}
  
  // প্রতিটি wishlist product দেখানো
  wishlist.forEach(item => {
    
    box.innerHTML += `

       <!-- Wishlist product card -->
    <div
      class="product wishlistProduct"
      onclick="openProductDetails('${item.productId || item.id}')"
    >

        <!-- Product image -->
        <img
          src="${item.image || ""}"
          alt="${item.name}"
        >

        <!-- Product name -->
        <h3>${item.name}</h3>

        <!-- Product price -->
        <div class="price">
          ৳${Number(item.price || 0).toLocaleString()}
        </div>

        <!-- Add to Cart button -->
        <button
          onclick="event.stopPropagation(); wishlistAddToCart('${item.productId || item.id}')"
        >
          🛒 Add to Cart
        </button>
        
        <!-- Remove from Wishlist -->
        <button
          onclick="event.stopPropagation(); toggleWishlist('${item.productId || item.id}')"
        >
          Remove ❤️
        </button>

      </div>

    `;
  });
}

// ========================================
// WISHLIST ADD TO CART SUCCESS
// ========================================

function wishlistAddToCart(productId) {
  
  // Wishlist-এর product খুঁজে বের করা
  const item =
    wishlist.find(
      product =>
      (product.productId || product.id) === productId
    );
  
  // Product না পাওয়া গেলে বন্ধ
  if (!item) {
    return;
  }
  
  // Existing cart function ব্যবহার করে
  // product-টি Cart-এ যোগ করা
  addToCart(productId);
  
  // ছোট success message
  alert("Added to Cart 🛒");
  
}

// ========================================
// PRODUCT DETAILS WISHLIST
// ========================================

function toggleDetailWishlist() {
  
  // Product Details-এর বর্তমান product আছে কিনা check
  if (!selectedProduct) {
    return;
  }
  
  // Wishlist toggle করা
  toggleWishlist(selectedProduct.id);
  
  // Button update করা
  setTimeout(() => {
    updateDetailWishlistButton();
  }, 100);
}


// ========================================
// UPDATE DETAILS WISHLIST BUTTON
// ========================================

function updateDetailWishlistButton() {
  
  // Wishlist button
  const button =
    document.getElementById(
      "detailWishlistButton"
    );
  
  // Button না থাকলে বন্ধ
  if (!button || !selectedProduct) {
    return;
  }
  
  // Product Wishlist-এ আছে কিনা
  const isWishlisted =
    wishlist.some(
      item =>
      item.id === selectedProduct.id
    );
  
  // Button text পরিবর্তন
  if (isWishlisted) {
    
    button.innerHTML =
      "❤️ Added to Wishlist";
    
  } else {
    
    button.innerHTML =
      "♡ Add to Wishlist";
  }
}

// ==================================
// STEP 21C: NOTIFICATION SYSTEM
// ==================================

function openNotifications() {
  const panel = document.getElementById(
    "notificationPanel"
  );
  
  if (panel) {
    panel.classList.add("active");
    loadNotifications();
  }
}

function closeNotifications() {
  const panel = document.getElementById(
    "notificationPanel"
  );
  
  if (panel) {
    panel.classList.remove("active");
  }
}

 // STEP 22B: LIVE FIREBASE NOTIFICATIONS

let notificationUnsubscribe = null;

function loadNotifications() {
  const user = window.shoporaAuth.currentUser;
  
  const list = document.getElementById(
    "notificationList"
  );
  
  const count = document.getElementById(
    "notificationCount"
  );
  
  if (!list || !count) return;
  
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }
  
  if (!user) {
    count.innerText = "0";
    
    list.innerHTML = `
      <div class="emptyNotifications">
        Please login first.
      </div>
    `;
    return;
  }
  
  list.innerHTML = `
    <div class="emptyNotifications">
      Loading notifications...
    </div>
  `;
  
  const notificationsRef =
    window.firebaseCollection(
      window.shoporaDB,
      "users",
      user.uid,
      "notifications"
    );
  
  if (typeof window.firebaseOnSnapshot !== "function") {
    list.innerHTML = `
      <div class="emptyNotifications">
        Live notifications are not connected.
      </div>
    `;
    return;
  }
  
  notificationUnsubscribe =
    window.firebaseOnSnapshot(
      notificationsRef,
      
      snapshot => {
        console.log("Notifications received:", snapshot.size);
snapshot.forEach(doc => {
  console.log("Notification:", doc.id, doc.data());
});
        const notifications = [];
        
        snapshot.forEach(doc => {
          notifications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        notifications.sort((a, b) =>
          String(b.createdAt || "").localeCompare(
            String(a.createdAt || "")
          )
        );
        
        const unread = notifications.filter(
          n => n.read !== true
        ).length;
        console.log(
  "NOTIFICATION READ STATUS:",
  notifications.map(n => ({
    id: n.id,
    read: n.read,
    className: n.read === true ? "read" : "unread"
  }))
);
        
        count.innerText =
          unread > 99 ? "99+" : String(unread);
        
        if (!notifications.length) {
          list.innerHTML = `
            <div class="emptyNotifications">
              No notifications yet 🔔
            </div>
          `;
          return;
        }
        
        
list.innerHTML = notifications.map(n => `
  <div
    class="notificationItem ${n.read === true ? "read" : "unread"}"
    onclick="markNotificationRead('${n.id}')"
    style="cursor:pointer"
  >
    <strong>
      ${escapeNotificationText(n.title || "Shopora Update")}
    </strong>

    <p>
      ${escapeNotificationText(n.message || "You have a new notification.")}
    </p>

    <small>
      ${escapeNotificationText(n.createdAt || "")}
    </small>
  </div>
`).join("");

      },
      
      error => {
        console.error(
          "LIVE NOTIFICATION ERROR:",
          error
        );
        
        list.innerHTML = `
          <div class="emptyNotifications">
            Could not load live notifications.
          </div>
        `;
      }
    );
}

// Safely display notification text
function escapeNotificationText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
};

// STEP 22C: MARK NOTIFICATION AS READ

async function markNotificationRead(notificationId) {
  const user = window.shoporaAuth.currentUser;
  
  if (!user || !notificationId) return;
  
  try {
    const notificationRef = window.firebaseDoc(
      window.shoporaDB,
      "users",
      user.uid,
      "notifications",
      notificationId
    );
    
    await window.firebaseSetDoc(
      notificationRef,
      {
        read: true
      },
      {
        merge: true
      }
    );
    
    console.log("Notification marked as read");
    
  } catch (error) {
    console.error(
      "MARK NOTIFICATION READ ERROR:",
      error
    );
  }
}


async function markAllNotificationsRead() {
  
const user = window.shoporaAuth.currentUser;

if (!user) {
  alert("Please login first.");
  return;
}


  if (!user) {
  console.error("Firebase Auth user not found.");
  alert("Login session পাওয়া যাচ্ছে না।");
  return;
  }

  try {
    const notificationsRef = window.firebaseCollection(
      window.shoporaDB,
      "users",
      user.uid,
      "notifications"
    );

    const snapshot = await window.firebaseGetDocs(notificationsRef);

    const unreadDocs = snapshot.docs.filter(
      notification => notification.data().read !== true
    );

    if (unreadDocs.length === 0) {
      alert("All notifications are already read.");
      return;
    }

    await Promise.all(
      unreadDocs.map(notification =>
        window.firebaseSetDoc(
          notification.ref,
          { read: true },
          { merge: true }
        )
      )
    );

    console.log("All notifications marked as read.");
  } catch (error) {
    console.error("Mark all as read failed:", error);
    alert("Could not mark all notifications as read. Please try again.");
  }
}


/* ========================================
   STEP 21B: PRODUCT REVIEWS & RATINGS
   ======================================== */

// Customer বর্তমানে কত star select করেছে
let selectedReviewRating = 0;


// ========================================
// 1. STAR RATING SELECT
// ========================================

function selectReviewRating(rating) {

  // 1 থেকে 5-এর মধ্যে rating হতে হবে
  if (rating < 1 || rating > 5) return;

  // নির্বাচিত rating সংরক্ষণ
  selectedReviewRating = rating;

  // সব star button খুঁজে বের করা
  const buttons = document.querySelectorAll(
    "#productReviews .starPicker button"
  );

  // নির্বাচিত star-গুলো হলুদ দেখানো
  buttons.forEach((button, index) => {
    button.textContent = index < rating ? "★" : "☆";
    button.style.color = index < rating ? "#F5A623" : "#999";
  });
}


// ========================================
// 2. CURRENT PRODUCT ID
// ========================================

// Product Details-এ বর্তমানে খোলা product-এর ID
function getReviewProductId() {

  // App-এর existing selectedProduct ব্যবহার
  if (
    typeof selectedProduct !== "undefined" &&
    selectedProduct &&
    selectedProduct.id
  ) {
    return selectedProduct.id;
  }

  // Product select না থাকলে null
  return null;
}


// ========================================
// 3. SUBMIT PRODUCT REVIEW
// ========================================

async function submitProductReview() {

  // Login করা customer
  const user = window.shoporaAuth.currentUser;

  // Review form-এর input
  const titleInput = document.getElementById("reviewTitle");
  const commentInput = document.getElementById("reviewComment");
  const message = document.getElementById("reviewMessage");
  const submitButton = document.getElementById("submitReviewButton");

  // বর্তমানে খোলা product
  const productId = getReviewProductId();

  // পুরোনো message পরিষ্কার
  message.textContent = "";

  // Login check
  if (!user) {
    message.textContent = "Please login before writing a review.";
    return;
  }

  // Product check
  if (!productId) {
    message.textContent = "Please open a product first.";
    return;
  }

  // Star rating check
  if (selectedReviewRating < 1) {
    message.textContent = "Please select a star rating.";
    return;
  }

  // Review text
  const title = titleInput.value.trim();
  const comment = commentInput.value.trim();

  // ফাঁকা review গ্রহণ করা হবে না
  if (!comment) {
    message.textContent = "Please write your review.";
    return;
  }

  // Double click করে একাধিকবার submit বন্ধ
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {

    // Firestore-এর product-specific reviews collection
    const reviewsRef = window.firebaseCollection(
      window.shoporaDB,
      "products",
      productId,
      "reviews"
    );

    // Review save করা
    await window.firebaseAddDoc(reviewsRef, {

      // Review লেখকের Firebase UID
      userId: user.uid,

      // Customer-এর নাম, email-এর local part থেকে
      // তৈরি করা display name
      userName: (
        user.displayName ||
        user.email?.split("@")[0] ||
        "Customer"
      ),

      // নির্বাচিত rating
      rating: selectedReviewRating,

      // Review title
      title: title,

      // Review comment
      comment: comment,

      // Server-এর সময়
      createdAt: window.firebaseServerTimestamp()

    });

    // Success message
    message.textContent = "Review submitted successfully! ⭐";

    // Form পরিষ্কার
    titleInput.value = "";
    commentInput.value = "";

    // Star rating reset
    selectReviewRating(0);

    // নতুন review-সহ list reload
    await loadProductReviews(productId);

  } catch (error) {

    // Error console-এ দেখা
    console.error("REVIEW SUBMIT ERROR:", error);

    // Customer-কে error জানানো
    message.textContent =
      "Review could not be submitted. " +
      (error.message || "Please try again.");

  } finally {

    // Submit button আবার চালু
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
}


// ========================================
// 4. LOAD PRODUCT REVIEWS
// ========================================

async function loadProductReviews(productId) {

  // Review list container
  const list = document.getElementById("reviewList");

  // Container না থাকলে বন্ধ
  if (!list || !productId) return;

  // Loading message
  list.innerHTML = "<p>Loading reviews...</p>";

  try {

    // Product-এর reviews collection
    const reviewsRef = window.firebaseCollection(
      window.shoporaDB,
      "products",
      productId,
      "reviews"
    );

    // Reviews পড়া
    const snapshot = await window.firebaseGetDocs(
      reviewsRef
    );

    // Firestore documents থেকে array তৈরি
    const reviews = [];

    snapshot.forEach(documentSnapshot => {
      reviews.push({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
      });
    });

    // নতুন review আগে দেখানো
    reviews.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    // Average rating হিসাব
    const average = reviews.length
      ? reviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / reviews.length
      : 0;

    // Average rating display
    document.getElementById("averageRating").textContent =
      average.toFixed(1);

    // Average stars display
    const roundedAverage = Math.round(average);

    document.getElementById("averageStars").textContent =
      "★".repeat(roundedAverage) +
      "☆".repeat(5 - roundedAverage);

    // Total review count
    document.getElementById("reviewCount").textContent =
      reviews.length +
      (reviews.length === 1 ? " review" : " reviews");

    // Review না থাকলে empty state
    if (reviews.length === 0) {

      list.innerHTML = `
        <div class="reviewPlaceholder">
          <p>⭐ No reviews yet.</p>
          <p>Be the first to review this product!</p>
        </div>
      `;

      return;
    }

    // প্রতিটি review card তৈরি
    list.innerHTML = reviews.map(review => {

      // Rating-এর star display
      const rating = Math.max(
        0,
        Math.min(5, Number(review.rating) || 0)
      );

      const stars =
        "★".repeat(rating) +
        "☆".repeat(5 - rating);

      // Customer-এর text HTML হিসেবে interpret
      // না করে নিরাপদে textContent দিয়ে বসানো হবে
      return `
        <article class="reviewCard">

          <div class="reviewCardTop">
            <strong class="reviewUser"></strong>
            <span class="reviewDate"></span>
          </div>

          <div class="reviewCardStars">${stars}</div>

          <h5 class="reviewCardTitle"></h5>

          <p class="reviewCardComment"></p>

        </article>
      `;
    }).join("");

    // User-supplied text নিরাপদে বসানো
    const cards = list.querySelectorAll(".reviewCard");

    cards.forEach((card, index) => {

      const review = reviews[index];

      card.querySelector(".reviewUser").textContent =
        review.userName || "Customer";

      card.querySelector(".reviewCardTitle").textContent =
        review.title || "";

      card.querySelector(".reviewCardComment").textContent =
        review.comment || "";

      // Firestore timestamp
      const timestamp = review.createdAt?.toDate?.();

      card.querySelector(".reviewDate").textContent =
        timestamp ? timestamp.toLocaleDateString() : "Just now";
    });

  } catch (error) {

    // Firestore rules বা network error
    console.error("LOAD REVIEWS ERROR:", error);

    list.innerHTML = `
      <p class="reviewPlaceholder">
        Could not load reviews. Please try again.
      </p>
    `;
  }
}

/* ========================================
   STEP 22B: ADMIN PRODUCT FORM SETUP
   ======================================== */

// Admin product form-এর event একবারই যুক্ত করব
function setupAdminProductForm() {
  const form = document.getElementById("adminProductForm");
  
  if (!form || form.dataset.initialized === "true") {
    return;
  }
  
  form.dataset.initialized = "true";
  
  // Product submit হলে আগে Admin ও input যাচাই
  form.addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const message = document.getElementById("adminProductMessage");
    const saveButton = document.getElementById("adminProductSaveButton");
    
    // বর্তমান user Admin কি না যাচাই
    const isAdmin = await checkAdmin();
    
    if (!isAdmin) {
      message.textContent = "Access denied. Admin only.";
      return;
    }
    
    // Form থেকে product-এর তথ্য নেওয়া
    
    // Form থেকে product-এর তথ্য নেওয়া
    const product = {
      name: document.getElementById("adminProductName").value.trim(),
      price: Number(document.getElementById("adminProductPrice").value),
      category: document.getElementById("adminProductCategory").value.trim(),
      image: document.getElementById("adminProductImage").value.trim(),
      description: document.getElementById("adminProductDescription").value.trim(),
      stock: Number(document.getElementById("adminProductStock").value),

      // Size-গুলো কমা দিয়ে আলাদা করে Array বানানো
      sizes: document.getElementById("adminProductSizes").value
        .split(",")
        .map(size => size.trim())
        .filter(Boolean),

      // Color-গুলো কমা দিয়ে আলাদা করে Array বানানো
      colors: document.getElementById("adminProductColors").value
        .split(",")
        .map(color => color.trim())
        .filter(Boolean)
    };

    // প্রয়োজনীয় তথ্য যাচাই
    if (
      !product.name ||
      !product.category ||
      !product.image ||
      !product.description ||
      !Number.isFinite(product.price) ||
      product.price <= 0 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0
    ) {
      message.textContent = "সব তথ্য সঠিকভাবে পূরণ করো।";
      return;
    }
    
    
    // ========================================
    // STEP 22D: SAVE PRODUCT TO FIRESTORE
    // ========================================

    // নতুন product হলে নতুন ID তৈরি হবে
    // Edit করলে আগের product ID ব্যবহার হবে
    const productId =
      document.getElementById("adminProductId").value.trim();

    try {
      // Save button সাময়িকভাবে বন্ধ
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";

      if (productId) {
        // আগের product-এর তথ্য update
        const productRef = window.firebaseDoc(
          window.shoporaDB,
          "products",
          productId
        );

        await window.firebaseSetDoc(
          productRef,
          product,
          { merge: true }
        );

        message.textContent = "Product updated successfully! ✅";

      } else {
        // নতুন product-এর জন্য document তৈরি
        const newProductRef = window.firebaseDoc(
          window.firebaseCollection(
            window.shoporaDB,
            "products"
          )
        );

        await window.firebaseSetDoc(
          newProductRef,
          product
        );

        message.textContent = "Product added successfully! 🎉";
      }

      // Form পরিষ্কার
      document.getElementById("adminProductForm").reset();
      document.getElementById("adminProductId").value = "";

      // Save button-এর label আগের অবস্থায় ফেরানো
      saveButton.textContent = "➕ Add Product";

      // Product list নতুন করে load
      await loadProducts();

      // Admin-এর product list-ও refresh
      if (typeof loadAdminProducts === "function") {
        await loadAdminProducts();
      }

    } catch (error) {
      // Error console-এ দেখানো
      console.error("ADMIN PRODUCT SAVE ERROR:", error);

      message.textContent =
        "Product save হয়নি: " + (error.message || "আবার চেষ্টা করো।");

    } finally {
      // Button আবার চালু
      saveButton.disabled = false;

      if (!document.getElementById("adminProductId").value) {
        saveButton.textContent = "➕ Add Product";
      }
    }

  });
}

// HTML তৈরি হওয়ার পর form setup
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAdminProductForm);
} else {
  setupAdminProductForm();
}


/* ========================================
   STEP 22E: ADMIN PRODUCT LIST, EDIT, DELETE
   ======================================== */

// Admin-এর product list Firestore থেকে load করা
  

/* ========================================
   STEP 23B: STOCK MANAGEMENT & ALERT
   ======================================== */

// Admin-এর product list ও stock alert লোড করা
async function loadAdminProducts() {
  // Product list দেখানোর HTML element নেওয়া
  const list = document.getElementById("adminProductsList");

  // প্রয়োজনীয় element না থাকলে কাজ বন্ধ
  if (!list) return;

  // শুধু Admin যেন stock দেখতে ও পরিচালনা করতে পারে
  if (!(await checkAdmin())) {
    list.textContent = "Access denied. Admin only.";
    return;
  }

  // লোড হওয়ার বার্তা দেখানো
  list.textContent = "Loading products...";

  try {
    // Firestore থেকে সব product নেওয়া
    const productsRef = window.firebaseCollection(
      window.shoporaDB,
      "products"
    );

    const snapshot = await window.firebaseGetDocs(productsRef);

    // আগের তালিকা পরিষ্কার করা
    list.replaceChildren();

    // মোট পণ্যের সংখ্যা এবং stock alert গণনা
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // সব পণ্য সাময়িকভাবে সংরক্ষণ করা
    const productItems = [];

    snapshot.forEach((item) => {
      const product = item.data();

      // Stock-কে সঠিক সংখ্যায় রূপান্তর করা
      const stock = Number(product.stock) || 0;

      // স্টক ০ হলে Out of Stock গণনা
      if (stock <= 0) {
        outOfStockCount++;
      }
      // স্টক ১–৫ হলে Low Stock গণনা
      else if (stock <= 5) {
        lowStockCount++;
      }

      // Product ও তার ID তালিকায় রাখা
      productItems.push({
        id: item.id,
        product: product,
        stock: stock
      });
    });

    // Low Stock এবং Out of Stock পণ্যের সংখ্যা
    const totalAlerts = lowStockCount + outOfStockCount;

    // সতর্কবার্তার বক্স তৈরি করা
    const alertBox = document.createElement("div");

    // কোনো পণ্যের স্টক কম বা শেষ হলে সতর্কবার্তা
    if (totalAlerts > 0) {
      alertBox.className = "lowStockAlert";

      // textContent ব্যবহার করায় product-এর নাম HTML হিসেবে চলবে না
      alertBox.textContent =
        "⚠️ Stock Alert! " +
        "Low Stock: " + lowStockCount +
        " টি, Out of Stock: " + outOfStockCount +
        " টি পণ্য।";

    } else {
      // সব পণ্যের স্টক ৫ পিসের বেশি
      alertBox.className = "stockAllGood";
      alertBox.textContent =
        "✅ সব পণ্যের স্টক ৫ পিসের বেশি।";
    }

    // সতর্কবার্তা তালিকার উপরে দেখানো
    list.appendChild(alertBox);

    // Product না থাকলে খালি তালিকার বার্তা
    if (productItems.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "এখনো কোনো product নেই।";
      list.appendChild(emptyMessage);
      return;
    }

    // প্রতিটি পণ্যের card তৈরি করা
    productItems.forEach(({ id, product, stock }) => {
      const card = document.createElement("article");
      card.className = "adminProductCard";

      // পণ্যের নাম
      const name = document.createElement("h4");
      name.textContent = product.name || "Unnamed Product";

      // দাম, stock ও category
      const details = document.createElement("p");
      details.textContent =
        "দাম: ৳" + (Number(product.price) || 0) +
        " | Stock: " + stock +
        " | Category: " + (product.category || "Other");

      // স্টকের অবস্থা দেখানোর badge
      const status = document.createElement("div");
      status.className = "stockStatusBadge";

      // স্টক শেষ হলে লাল badge
      if (stock <= 0) {
        status.classList.add("stockOut");
        status.textContent = "⛔ Out of Stock";
      }
      // ১–৫ পিস থাকলে হলুদ badge
      else if (stock <= 5) {
        status.classList.add("stockLow");
        status.textContent = "⚠️ Low Stock: " + stock + " পিস";
      }
      // ৫ পিসের বেশি থাকলে সবুজ badge
      else {
        status.classList.add("stockAvailable");
        status.textContent = "✅ In Stock";
      }

      // Edit button
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "✏️ Edit";

      // Edit করলে আগের edit function চালানো
      editButton.addEventListener("click", () => {
        editAdminProduct(id, product);
      });

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "🗑️ Delete";

      // Delete করলে আগের delete function চালানো
      deleteButton.addEventListener("click", () => {
        deleteAdminProduct(
          id,
          product.name || "this product"
        );
      });

      // সব element card-এর মধ্যে সাজানো
      card.append(
        name,
        details,
        status,
        editButton,
        deleteButton
      );

      // Card-টি product list-এ যোগ করা
      list.appendChild(card);
    });

  } catch (error) {
    // কোনো সমস্যা হলে console-এ error দেখানো
    console.error("STOCK MANAGEMENT ERROR:", error);

    // ব্যবহারকারীকে error message দেখানো
    list.textContent =
      "Stock list load হয়নি। আবার চেষ্টা করো।";
  }
}

/* ========================================
   END STEP 23B
   ======================================== */



// ========================================
// EDIT PRODUCT
// ========================================

async function editAdminProduct(productId, product) {
  // শুধু Admin edit করতে পারবে
  if (!(await checkAdmin())) {
    alert("Access denied. Admin only.");
    return;
  }

  // আগের product-এর তথ্য form-এ বসানো
  document.getElementById("adminProductId").value = productId;
  document.getElementById("adminProductName").value = product.name || "";
  document.getElementById("adminProductPrice").value = product.price ?? "";
  document.getElementById("adminProductCategory").value =
    product.category || "";
  document.getElementById("adminProductImage").value = product.image || "";
  document.getElementById("adminProductDescription").value =
    product.description || "";
  document.getElementById("adminProductStock").value = product.stock ?? 0;
  
  
  // আগের পণ্যের Size-গুলো কমা দিয়ে দেখানো
  const sizesInput = document.getElementById("adminProductSizes");
  if (sizesInput) {
    sizesInput.value = Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : "";
  }

  // আগের পণ্যের Color-গুলো কমা দিয়ে দেখানো
  const colorsInput = document.getElementById("adminProductColors");
  if (colorsInput) {
    colorsInput.value = Array.isArray(product.colors)
      ? product.colors.join(", ")
      : "";
  }


  // Button ও message পরিবর্তন
  document.getElementById("adminProductSaveButton").textContent =
    "💾 Update Product";
    
    
  // Edit করার সময় Cancel Edit button দেখানো
  document.getElementById("adminProductCancelButton").hidden = false;


  document.getElementById("adminProductMessage").textContent =
    "Product edit mode চালু হয়েছে।";

  // Form-এর কাছে নিয়ে যাওয়া
  document.getElementById("adminProductForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// ========================================
// DELETE PRODUCT
// ========================================

async function deleteAdminProduct(productId, productName) {
  // Delete করার আগেও Admin যাচাই
  if (!(await checkAdmin())) {
    alert("Access denied. Admin only.");
    return;
  }

  // ভুল করে delete ঠেকাতে confirmation
  const confirmed = confirm(
    '"' + productName + '" product মুছে ফেলতে চাও?'
  );

  if (!confirmed) return;

  try {
    const productRef = window.firebaseDoc(
      window.shoporaDB,
      "products",
      productId
    );

    await window.firebaseDeleteDoc(productRef);

    alert("Product deleted successfully! ✅");

    // Customer ও Admin product list refresh
    await loadProducts();
    await loadAdminProducts();

  } catch (error) {
    console.error("ADMIN PRODUCT DELETE ERROR:", error);

    alert(
      "Product delete হয়নি: " +
      (error.message || "আবার চেষ্টা করো।")
    );
  }
}


// ========================================
// CANCEL EDIT
// ========================================

function cancelAdminProductEdit() {
  document.getElementById("adminProductForm").reset();
  document.getElementById("adminProductId").value = "";

  document.getElementById("adminProductSaveButton").textContent =
    "➕ Add Product";

  document.getElementById("adminProductMessage").textContent = "";
  
  
  // Cancel করলে button আবার লুকানো
  document.getElementById("adminProductCancelButton").hidden = true;

}


// Cancel Edit button-এ click handler যোগ করা
document.addEventListener("DOMContentLoaded", () => {
  const cancelButton = document.getElementById(
    "adminProductCancelButton"
  );

  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      cancelAdminProductEdit
    );
  }
});

// ========================================
// END STEP 22E
// ========================================


/* ========================================
   STEP 25D: COUPON VALIDATION
   ======================================== */

// বর্তমান checkout-এর applied coupon সংরক্ষণ
// এই variable একবারই declare করবে
let shoporaAppliedCoupon = null;

// Coupon discount হিসাব করার function
function calculateCouponDiscount(coupon, subtotal) {
  // Percentage discount হিসাব
  if (coupon.discountType === "percent") {
    const percentage = Number(coupon.discountValue);

    // Invalid percentage হলে discount শূন্য
    if (!Number.isFinite(percentage) ||
        percentage <= 0 ||
        percentage > 100) {
      return 0;
    }

    // Maximum discount limit প্রয়োগ
    const rawDiscount = subtotal * percentage / 100;
    const maxDiscount = Number(coupon.maxDiscount);

    return Math.max(
      0,
      Math.min(
        rawDiscount,
        Number.isFinite(maxDiscount) && maxDiscount >= 0
          ? maxDiscount
          : rawDiscount,
        subtotal
      )
    );
  }

  // Fixed amount discount হিসাব
  if (coupon.discountType === "fixed") {
    const fixedDiscount = Number(coupon.discountValue);

    if (!Number.isFinite(fixedDiscount) || fixedDiscount <= 0) {
      return 0;
    }

    // Discount subtotal-এর বেশি হতে পারবে না
    return Math.min(fixedDiscount, subtotal);
  }

  // অজানা discount type হলে discount শূন্য
  return 0;
}

// Coupon Apply button-এর function
async function applyCoupon() {
  // প্রয়োজনীয় HTML element নেওয়া
  const codeInput = document.getElementById("couponCode");
  const message = document.getElementById("couponMessage");
  const info = document.getElementById("appliedCouponInfo");
  const button = document.getElementById("applyCouponButton");

  // Coupon section না থাকলে কাজ বন্ধ
  if (!codeInput || !message || !info || !button) return;

  // Coupon code পরিষ্কার করে uppercase করা
  const code = codeInput.value.trim().toUpperCase();

  // আগের message পরিষ্কার
  message.textContent = "";
  info.hidden = true;

  // Login প্রয়োজন
  const user = window.shoporaAuth.currentUser;

  if (!user) {
    shoporaAppliedCoupon = null;
    message.textContent = "কুপন ব্যবহার করতে আগে লগইন করো।";
    return;
  }

  // Code না দিলে validation বন্ধ
  if (!code) {
    shoporaAppliedCoupon = null;
    message.textContent = "Coupon code লিখো।";
    return;
  }

  // বর্তমান Cart subtotal হিসাব
  const subtotal = cart.reduce((sum, item) => {
    return sum +
      Number(item.price || 0) *
      Number(item.quantity || 1);
  }, 0);

  // Button loading state
  button.disabled = true;
  button.textContent = "Checking...";

  try {
    // Firestore থেকে coupon document নেওয়া
    const couponRef = window.firebaseDoc(
      window.shoporaDB,
      "coupons",
      code
    );

    const couponSnapshot =
      await window.firebaseGetDoc(couponRef);

    // Coupon না থাকলে বাতিল
    if (!couponSnapshot.exists()) {
      throw new Error("এই Coupon code পাওয়া যায়নি।");
    }

    const coupon = couponSnapshot.data();

    // Coupon active কি না যাচাই
    if (coupon.active !== true) {
      throw new Error("এই Coupon বর্তমানে চালু নেই।");
    }

    // Expiry date যাচাই
    if (
      typeof coupon.expiresAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(coupon.expiresAt)
    ) {
      throw new Error("Coupon expiry date সঠিক নয়।");
    }

    // Date-only expiry দিনের শেষ পর্যন্ত বৈধ
    const expiry = new Date(
      coupon.expiresAt + "T23:59:59"
    );

    if (
      Number.isNaN(expiry.getTime()) ||
      Date.now() > expiry.getTime()
    ) {
      throw new Error("এই Coupon-এর মেয়াদ শেষ।");
    }

    // Minimum order amount যাচাই
    const minOrder = Number(coupon.minOrder || 0);

    if (
      !Number.isFinite(minOrder) ||
      minOrder < 0 ||
      subtotal < minOrder
    ) {
      throw new Error(
        "এই Coupon ব্যবহার করতে কমপক্ষে ৳" +
        (Number.isFinite(minOrder) ? minOrder : 0) +
        " মূল্যের পণ্য লাগবে।"
      );
    }

    // বৈধ coupon discount হিসাব
    const discount = calculateCouponDiscount(
      coupon,
      subtotal
    );

    // অকার্যকর discount হলে coupon গ্রহণ নয়
    if (discount <= 0) {
      throw new Error("এই Coupon-এ discount পাওয়া যাচ্ছে না।");
    }

    // Coupon-এর তথ্য বর্তমান session-এ রাখা
    shoporaAppliedCoupon = {
      code: code,
      discount: discount
    };

    // সফল message দেখানো
    message.textContent = "Coupon সফলভাবে Apply হয়েছে!";

    // Discount amount দেখানো
    info.textContent =
      "🏷️ " + code +
      " — ৳" + discount.toLocaleString() +
      " discount";

    info.hidden = false;

    // Checkout summary-তে discount দেখানো
    // Step 25E-তে এই function যোগ করা হবে
    if (typeof refreshCouponSummary === "function") {
      refreshCouponSummary();
    }

  } catch (error) {
    // Coupon invalid হলে applied state পরিষ্কার
    shoporaAppliedCoupon = null;

    message.textContent =
      error.message || "Coupon যাচাই করা যায়নি।";

    // আগের discount সরানো
    if (typeof refreshCouponSummary === "function") {
      refreshCouponSummary();
    }

  } finally {
    // Button আগের অবস্থায় ফেরানো
    button.disabled = false;
    button.textContent = "Apply";
  }
}

/* ========================================
   END STEP 25D
   ======================================== */

/* ========================================
   STEP 25E: COUPON DISCOUNT SUMMARY
   ======================================== */

// Cart-এর subtotal হিসাব করে coupon discount দেখায়
function refreshCouponSummary() {
  const info = document.getElementById("appliedCouponInfo");

  // প্রয়োজনীয় HTML element না থাকলে থামবে
  if (!info) return;

  // Cart-এর মোট পণ্যমূল্য হিসাব
  const subtotal = cart.reduce((sum, item) => {
    return sum +
      Number(item.price || 0) *
      Number(item.quantity || 1);
  }, 0);

  // Delivery charge হিসাব
  const delivery = subtotal >= 2000 ? 0 : 60;

  // বর্তমানে বৈধ coupon থাকলে discount হিসাব
  let discount = 0;

  if (shoporaAppliedCoupon) {
    discount = Math.min(
      Number(shoporaAppliedCoupon.discount) || 0,
      subtotal
    );
  }

  // Discount-এর পরে পরিশোধযোগ্য মোট টাকা
  const total = Math.max(0, subtotal - discount) + delivery;

  // Coupon discount ও নতুন total দেখানো
  if (shoporaAppliedCoupon && discount > 0) {
    info.textContent =
      "🏷️ Coupon: " + shoporaAppliedCoupon.code +
      " | Discount: ৳" + discount.toFixed(2) +
      " | Delivery: ৳" + delivery.toFixed(2) +
      " | Payable Total: ৳" + total.toFixed(2);

    info.hidden = false;
  } else {
    info.hidden = true;
  }
}

/* ========================================
   END STEP 25E SUMMARY
   ======================================== */


/* =========================================
   STEP 26D: ADMIN COUPON MANAGEMENT
   Admin verification + CRUD operations
   ========================================= */

// Coupon collection-এর reference
function getAdminCouponsCollection() {
  return window.firebaseCollection(
    window.shoporaDB,
    "coupons"
  );
}

// বর্তমান user অনুমোদিত Admin কি না যাচাই
async function isShoporaCouponAdmin() {
  const user = window.shoporaAuth.currentUser;

  // Login না করা user Admin নয়
  if (!user) return false;

  try {
    // Admin UID দিয়ে admins document খোঁজা
    const adminRef = window.firebaseDoc(
      window.shoporaDB,
      "admins",
      user.uid
    );

    const adminSnapshot =
      await window.firebaseGetDoc(adminRef);

    // Document থাকলে এবং role admin হলেই অনুমতি
    return adminSnapshot.exists() &&
      adminSnapshot.data().role === "admin";

  } catch (error) {
    console.error("Admin verification error:", error);
    return false;
  }
}

// Coupon form-এর message দেখানো
function showAdminCouponMessage(message, isError = false) {
  const element =
    document.getElementById("adminCouponMessage");

  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#b42318" : "#067647";
}

// Coupon form খালি করা
function resetAdminCouponForm() {
  // Cancel Edit button লুকিয়ে রাখা
  document.getElementById("adminCouponCancelButton").hidden = true;
  
  const form = document.getElementById("adminCouponForm");

  if (form) form.reset();

  // Edit mode বন্ধ করা
  document.getElementById("adminCouponId").value = "";
  document.getElementById("adminCouponCode").readOnly = false;
  document.getElementById("adminCouponSaveButton").textContent =
    "➕ Save Coupon";
    
    
  // Cancel Edit button লুকিয়ে রাখা
  document.getElementById("adminCouponCancelButton").hidden = true;


  // Active checkbox default চালু
  document.getElementById("adminCouponActive").checked = true;
}

// Coupon code যাচাই ও normalize করা
function normalizeAdminCouponCode(value) {
  return value.trim().toUpperCase();
}

// নতুন Coupon তৈরি বা আগের Coupon update
async function saveAdminCoupon(event) {
  // Page reload বন্ধ করা
  event.preventDefault();

  // Admin permission যাচাই
  if (!(await isShoporaCouponAdmin())) {
    showAdminCouponMessage(
      "শুধু অনুমোদিত Admin Coupon পরিবর্তন করতে পারবে।",
      true
    );
    return;
  }

  // Form-এর values নেওয়া
  const originalId =
    document.getElementById("adminCouponId").value.trim();

  const code = normalizeAdminCouponCode(
    document.getElementById("adminCouponCode").value
  );

  const discountType =
    document.getElementById("adminCouponType").value;

  const discountValue = Number(
    document.getElementById("adminCouponValue").value
  );

  const minOrder = Number(
    document.getElementById("adminCouponMinOrder").value
  );

  const maxDiscount = Number(
    document.getElementById("adminCouponMaxDiscount").value
  );

  const expiresAt =
    document.getElementById("adminCouponExpiry").value;

  const active =
    document.getElementById("adminCouponActive").checked;

  // Coupon ID-তে শুধু অক্ষর, সংখ্যা, underscore ও hyphen
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
    showAdminCouponMessage(
      "Coupon code-এ শুধু A-Z, 0-9, underscore ও hyphen ব্যবহার করো।",
      true
    );
    return;
  }

  // Discount value যাচাই
  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (discountType === "percent" && discountValue > 100)
  ) {
    showAdminCouponMessage(
      "Discount value সঠিকভাবে লিখো। Percentage সর্বোচ্চ 100।",
      true
    );
    return;
  }

  // Minimum order ও maximum discount যাচাই
  if (
    !Number.isFinite(minOrder) ||
    minOrder < 0 ||
    !Number.isFinite(maxDiscount) ||
    maxDiscount < 0
  ) {
    showAdminCouponMessage(
      "Minimum Order ও Maximum Discount সঠিকভাবে লিখো।",
      true
    );
    return;
  }

  // Expiry date যাচাই
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    showAdminCouponMessage(
      "সঠিক Expiry Date নির্বাচন করো।",
      true
    );
    return;
  }

  // HTML date-এর আসল calendar date যাচাই
  const parsedDate = new Date(expiresAt + "T00:00:00Z");

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== expiresAt
  ) {
    showAdminCouponMessage("Expiry Date সঠিক নয়।", true);
    return;
  }

  const button =
    document.getElementById("adminCouponSaveButton");

  button.disabled = true;
  showAdminCouponMessage("Coupon সংরক্ষণ হচ্ছে...");

  try {
    // Firestore-এ Coupon document reference
    const couponRef = window.firebaseDoc(
      getAdminCouponsCollection(),
      code
    );

    // Edit করলে আগের document ID একই থাকতে হবে
    if (originalId && originalId !== code) {
      throw new Error(
        "Edit করার সময় Coupon Code পরিবর্তন করা যাবে না।"
      );
    }

    // Coupon-এর fields
    const couponData = {
      code: code,
      discountType: discountType,
      discountValue: discountValue,
      minOrder: minOrder,
      maxDiscount: maxDiscount,
      active: active,
      expiresAt: expiresAt
    };

    // Edit mode হলে document update
    if (originalId) {
      await window.firebaseSetDoc(
        couponRef,
        couponData,
        { merge: false }
      );

      showAdminCouponMessage("Coupon সফলভাবে update হয়েছে!");

    } else {
      // আগে একই Coupon আছে কি না যাচাই
      const existing =
        await window.firebaseGetDoc(couponRef);

      if (existing.exists()) {
        throw new Error(
          "এই Coupon Code আগে থেকেই আছে। অন্য code ব্যবহার করো।"
        );
      }

      // নতুন Coupon তৈরি
      await window.firebaseSetDoc(couponRef, couponData);

      showAdminCouponMessage("নতুন Coupon তৈরি হয়েছে!");
    }

    // Form reset ও list refresh
    resetAdminCouponForm();
    await loadAdminCoupons();

  } catch (error) {
    console.error("Save coupon error:", error);

    showAdminCouponMessage(
      error.message || "Coupon সংরক্ষণ করা যায়নি।",
      true
    );

  } finally {
    button.disabled = false;
  }
}

// Coupon edit করার জন্য form-এ values বসানো
async function editAdminCoupon(code) {
  if (!(await isShoporaCouponAdmin())) {
    alert("Admin permission প্রয়োজন।");
    return;
  }

  try {
    const couponRef = window.firebaseDoc(
      window.shoporaDB,
      "coupons",
      code
    );

    const snapshot =
      await window.firebaseGetDoc(couponRef);

    if (!snapshot.exists()) {
      alert("Coupon পাওয়া যায়নি।");
      return;
    }

    const coupon = snapshot.data();

    // Existing values form-এ বসানো
    document.getElementById("adminCouponId").value = code;
    document.getElementById("adminCouponCode").value = coupon.code;
    document.getElementById("adminCouponCode").readOnly = true;
    document.getElementById("adminCouponType").value =
      coupon.discountType;
    document.getElementById("adminCouponValue").value =
      coupon.discountValue;
    document.getElementById("adminCouponMinOrder").value =
      coupon.minOrder;
    document.getElementById("adminCouponMaxDiscount").value =
      coupon.maxDiscount;
    document.getElementById("adminCouponExpiry").value =
      coupon.expiresAt;
    document.getElementById("adminCouponActive").checked =
      coupon.active === true;

    document.getElementById("adminCouponSaveButton").textContent =
      "💾 Update Coupon";
      
    // Save button-এর লেখা Update Coupon করা
    document.getElementById("adminCouponSaveButton").textContent =
      "💾 Update Coupon";

    // Edit mode-এ Cancel Edit button দেখানো
    document.getElementById("adminCouponCancelButton").hidden = false;

    // Coupon edit mode চালু হয়েছে—message দেখানো
    showAdminCouponMessage("Coupon edit mode চালু হয়েছে।");

    // Coupon form-এর কাছে স্ক্রল করা
    document.getElementById("adminCouponForm")
      .scrollIntoView({ behavior: "smooth", block: "start" });


    showAdminCouponMessage("Coupon edit mode চালু হয়েছে।");

    // Form-এর কাছে scroll করা
    document.getElementById("adminCouponForm")
      .scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (error) {
    console.error("Edit coupon error:", error);
    alert("Coupon edit করা যায়নি: " + error.message);
  }
}

// Coupon delete করা
async function deleteAdminCoupon(code) {
  // Delete-এর আগে Admin যাচাই
  if (!(await isShoporaCouponAdmin())) {
    alert("শুধু Admin Coupon delete করতে পারবে।");
    return;
  }

  // ভুল করে delete ঠেকাতে confirmation
  if (!confirm("আপনি কি " + code + " Coupon delete করতে চান?")) {
    return;
  }

  try {
    const couponRef = window.firebaseDoc(
      window.shoporaDB,
      "coupons",
      code
    );

    await window.firebaseDeleteDoc(couponRef);

    showAdminCouponMessage("Coupon delete হয়েছে।");
    await loadAdminCoupons();

  } catch (error) {
    console.error("Delete coupon error:", error);
    showAdminCouponMessage(
      "Coupon delete করা যায়নি: " + error.message,
      true
    );
  }
}

// Firestore থেকে সব Coupon এনে Admin list-এ দেখানো
async function loadAdminCoupons() {
  const list = document.getElementById("adminCouponsList");

  if (!list) return;

  // List দেখানোর আগে Admin যাচাই
  if (!(await isShoporaCouponAdmin())) {
    list.textContent = "Coupon management দেখতে Admin login প্রয়োজন।";
    return;
  }

  list.textContent = "Coupons loading...";

  try {
    const snapshot = await window.firebaseGetDocs(
      getAdminCouponsCollection()
    );

    // আগের list পরিষ্কার
    list.replaceChildren();

    if (snapshot.empty) {
      list.textContent = "এখনো কোনো Coupon তৈরি হয়নি।";
      return;
    }

    // প্রতিটি Coupon-এর জন্য একটি card
    snapshot.forEach((couponDoc) => {
      const coupon = couponDoc.data();
      const card = document.createElement("article");

      card.style.cssText =
        "padding:14px;border:1px solid #e4e7ec;" +
        "border-radius:12px;background:#fff;";

      // TextContent ব্যবহার করে Coupon values নিরাপদে দেখানো
      const title = document.createElement("h4");
      title.textContent = coupon.code || couponDoc.id;

      const details = document.createElement("p");
      details.textContent =
        (coupon.discountType === "percent"
          ? coupon.discountValue + "%"
          : "৳" + coupon.discountValue) +
        " discount • Minimum ৳" + coupon.minOrder +
        " • Maximum ৳" + coupon.maxDiscount +
        " • Expiry " + coupon.expiresAt;

      const status = document.createElement("p");
      status.textContent =
        coupon.active === true ? "🟢 Active" : "⚪ Inactive";

      // Edit button
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "✏️ Edit";
      editButton.style.marginRight = "8px";
      editButton.addEventListener("click", () => {
        editAdminCoupon(couponDoc.id);
      });

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "🗑️ Delete";
      deleteButton.addEventListener("click", () => {
        deleteAdminCoupon(couponDoc.id);
      });

      // Card-এর মধ্যে elements যোগ করা
      card.append(title, details, status, editButton, deleteButton);
      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load coupons error:", error);
    list.textContent =
      "Coupon list লোড করা যায়নি: " + error.message;
  }
}

// Cancel Edit button-এর কাজ
function cancelAdminCouponEdit() {
  resetAdminCouponForm();
  showAdminCouponMessage("Edit বাতিল করা হয়েছে।");
}

// HTML elements প্রস্তুত হলে event listener যোগ
function initializeAdminCouponManagement() {
  const form = document.getElementById("adminCouponForm");
  const cancelButton =
    document.getElementById("adminCouponCancelButton");

  // একই listener বারবার যোগ না করার জন্য
  if (form && form.dataset.couponInitialized !== "true") {
    form.addEventListener("submit", saveAdminCoupon);
    form.dataset.couponInitialized = "true";
  }

  if (
    cancelButton &&
    cancelButton.dataset.couponInitialized !== "true"
  ) {
    cancelButton.addEventListener(
      "click",
      cancelAdminCouponEdit
    );

    cancelButton.dataset.couponInitialized = "true";
  }

  // Admin list লোড
  loadAdminCoupons();
}

// DOM তৈরি হয়ে গেলে initialize
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAdminCouponManagement
  );
} else {
  initializeAdminCouponManagement();
}

/* =========================================
   END STEP 26D
   ========================================= */
// Open the Privacy Policy page and hide the Admin Panel.
function openPrivacyPolicyPage() {
  const page = document.getElementById("privacy-policy-page");
  
  if (!page) return;
  
  // Remember which direct body elements were visible.
  document.querySelectorAll("body > *").forEach((element) => {
    if (
      element.id !== "privacy-policy-page" &&
      element.tagName !== "SCRIPT"
    ) {
      element.dataset.policyPreviousHidden =
        element.hidden ? "yes" : "no";
      
      element.hidden = true;
    }
  });
  
  page.hidden = false;
  window.scrollTo(0, 0);
}

// Close the policy and restore the previous view.
function closePrivacyPolicyPage() {
  const page = document.getElementById("privacy-policy-page");
  
  if (!page) return;
  
  page.hidden = true;
  
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.dataset.policyPreviousHidden !== undefined) {
      element.hidden =
        element.dataset.policyPreviousHidden === "yes";
      
      delete element.dataset.policyPreviousHidden;
    }
  });
  
  window.scrollTo(0, 0);
}

// Open the Shopora Terms & Conditions page.
function openTermsPage() {
  const page = document.getElementById("shopora-terms-page");
  
  if (!page) return;
  
  // Remember the visibility of the current main sections.
  document.querySelectorAll("body > *").forEach((element) => {
    if (
      element.id !== "shopora-terms-page" &&
      element.tagName !== "SCRIPT"
    ) {
      element.dataset.termsPreviousHidden =
        element.hidden ? "yes" : "no";
      
      element.hidden = true;
    }
  });
  
  // Display the Terms page.
  page.hidden = false;
  window.scrollTo(0, 0);
}

// Close Terms and restore the previous view.
function closeTermsPage() {
  const page = document.getElementById("shopora-terms-page");
  
  if (!page) return;
  
  page.hidden = true;
  
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.dataset.termsPreviousHidden !== undefined) {
      element.hidden =
        element.dataset.termsPreviousHidden === "yes";
      
      delete element.dataset.termsPreviousHidden;
    }
  });
  
  window.scrollTo(0, 0);
}

// Open the Contact Us page.
function openContactPage() {
  const page = document.getElementById("shopora-contact-page");
  
  if (!page) return;
  
  // Save visibility before opening the contact page.
  document.querySelectorAll("body > *").forEach((element) => {
    if (
      element.id !== "shopora-contact-page" &&
      element.tagName !== "SCRIPT"
    ) {
      element.dataset.contactPreviousHidden =
        element.hidden ? "yes" : "no";
      
      element.hidden = true;
    }
  });
  
  page.hidden = false;
  window.scrollTo(0, 0);
}

// Return to the previous screen.
function closeContactPage() {
  const page = document.getElementById("shopora-contact-page");
  
  if (!page) return;
  
  page.hidden = true;
  
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.dataset.contactPreviousHidden !== undefined) {
      element.hidden =
        element.dataset.contactPreviousHidden === "yes";
      
      delete element.dataset.contactPreviousHidden;
    }
  });
  
  window.scrollTo(0, 0);
}

// Prepare a message in the user's email application.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shoporaContactForm");
  
  if (!form) return;
  
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const name = document.getElementById("contactCustomerName").value.trim();
    const email = document.getElementById("contactCustomerEmail").value.trim();
    const subject = document.getElementById("contactSubject").value;
    const message = document.getElementById("contactMessage").value.trim();
    const status = document.getElementById("contactFormMessage");
    
    // Check required fields.
    if (!name || !email || !subject || !message) {
      status.textContent = "Please complete all fields.";
      return;
    }
    
    // Replace this placeholder with your real support email.
    const supportEmail = "rk5110432@gmail.com";
    
    if (supportEmail.includes("YOUR_SUPPORT_EMAIL")) {
      status.textContent =
        "Please configure Shopora's real support email in app.js first.";
      return;
    }
    
    // Encode the message for an email link.
    const body = `Name: ${name}\nCustomer Email: ${email}\n\n${message}`;
    const mailto =
      `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    
    status.textContent = "Opening your email application...";
    
    // Open the device's email app.
    window.location.href = mailto;
  });
});


/* Open the Shopora FAQ page */
function openFAQPage() {
  const page = document.getElementById("shopora-faq-page");
  if (!page) return;

  // Remember which top-level elements were already hidden.
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.id !== "shopora-faq-page" && element.tagName !== "SCRIPT") {
      element.dataset.faqPreviousHidden = element.hidden ? "yes" : "no";
      element.hidden = true;
    }
  });

  page.hidden = false;
  window.scrollTo(0, 0);
}

/* Return from FAQ to the previous screen */
function closeFAQPage() {
  const page = document.getElementById("shopora-faq-page");
  if (!page) return;

  page.hidden = true;

  // Restore the previous visibility of top-level elements.
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.dataset.faqPreviousHidden !== undefined) {
      element.hidden = element.dataset.faqPreviousHidden === "yes";
      delete element.dataset.faqPreviousHidden;
    }
  });

  window.scrollTo(0, 0);
}


/* Open the About Shopora page */
function openAboutPage() {
  const page = document.getElementById("shopora-about-page");
  if (!page) return;

  // Remember the previous visibility of top-level elements.
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.id !== "shopora-about-page" &&
        element.tagName !== "SCRIPT") {
      element.dataset.aboutPreviousHidden =
        element.hidden ? "yes" : "no";
      element.hidden = true;
    }
  });

  page.hidden = false;
  window.scrollTo(0, 0);
}

/* Return from About page to the previous screen */
function closeAboutPage() {
  const page = document.getElementById("shopora-about-page");
  if (!page) return;

  page.hidden = true;

  // Restore the previous visibility of top-level elements.
  document.querySelectorAll("body > *").forEach((element) => {
    if (element.dataset.aboutPreviousHidden !== undefined) {
      element.hidden =
        element.dataset.aboutPreviousHidden === "yes";
      delete element.dataset.aboutPreviousHidden;
    }
  });

  window.scrollTo(0, 0);
}

// Open Shop and show the product section.
function openShopPage() {
  // Find the product section.
  const products = document.getElementById("products");
  
  // If the section exists, scroll to it.
  if (products) {
    products.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


/* Shopora Banner Slider */
let shoporaCurrentBanner = 0;
let shoporaBannerTimer = null;

// নির্দিষ্ট ব্যানার দেখানো
function showShoporaBanner(index) {
  const slider = document.getElementById("shoporaBannerSlider");
  if (!slider) return;

  const banners = slider.querySelectorAll(".shopora-banner");
  const dots = slider.querySelectorAll(".banner-dot");

  if (!banners.length) return;

  shoporaCurrentBanner = (index + banners.length) % banners.length;

  banners.forEach((banner, i) => {
    banner.classList.toggle("active", i === shoporaCurrentBanner);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === shoporaCurrentBanner);
  });
}

// অফার বাটনে চাপ দিলে Product List-এ যাওয়া
function shoporaBannerShop() {
  const productList = document.getElementById("productList");

  if (productList) {
    productList.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } else {
    alert("Products section পাওয়া যায়নি।");
  }
}

// ব্যানার স্বয়ংক্রিয়ভাবে পরিবর্তন
function startShoporaBannerSlider() {
  if (shoporaBannerTimer) {
    clearInterval(shoporaBannerTimer);
  }

  const slider = document.getElementById("shoporaBannerSlider");
  if (!slider) return;

  showShoporaBanner(shoporaCurrentBanner);

  shoporaBannerTimer = setInterval(() => {
    showShoporaBanner(shoporaCurrentBanner + 1);
  }, 4000);
}

// HTML onclick থেকে ব্যবহারযোগ্য করা
window.showShoporaBanner = showShoporaBanner;
window.shoporaBannerShop = shoporaBannerShop;

// পেজ লোড হলে Slider চালু করা
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startShoporaBannerSlider);
} else {
  startShoporaBannerSlider();
}



// =====================================
// SHOPORA SPLASH SCREEN
// =====================================

// Splash Screen কয়েক সেকেন্ড পর লুকানো
function hideShoporaSplash() {
  const splash = document.getElementById("shoporaSplash");

  if (!splash) return;

  // Fade-out Animation শুরু
  splash.classList.add("splash-hidden");
}

// পেজ লোড হওয়ার পর Splash Screen দেখানো
function initShoporaSplash() {
  const splash = document.getElementById("shoporaSplash");

  if (!splash) return;

  // 2.5 সেকেন্ড পর Splash Screen বন্ধ
  setTimeout(hideShoporaSplash, 2500);
}

// HTML পুরো লোড হলে চালু করা
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShoporaSplash);
} else {
  initShoporaSplash();
}

