let allBookings = [];
let allProperties = [];
let properties = [];
let editingPropertyIndex = null;

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Login successful!");

                localStorage.setItem("userId", data.id);

                // Redirect
                window.location.href = "index.html";
            } else {
                alert("Invalid email or password");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Server error");
        });
}

function registerUser() {
    const user = {
        email: document.getElementById("email").value,
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
    };

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Account created!");

                window.location.href = "login.html";
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Server error");
        });
}

function updateAuthButton() {
    const authBtn = document.getElementById("auth-btn");
    const userId = localStorage.getItem("userId");

    if (!authBtn) return;

    if (userId && userId !== "0") {
        authBtn.textContent = "Logout";
    } else {
        authBtn.textContent = "Sign In";
    }
}

function handleAuth() {
    const userId = localStorage.getItem("userId");

    if (userId && userId !== "0") {
        // LOGOUT
        localStorage.removeItem("userId");

        updateAuthButton();

        window.location.reload();
    } else {
        // GO TO LOGIN
        window.location.href = "login.html";
    }
}

async function loadBookings() {
    try {
        const userId = parseInt(localStorage.getItem("userId"));

        if (!userId) {
            console.log("No user logged in");
            return;
        }

        const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

        console.log("Stored bookings:", bookings);
        console.log("Current userId:", userId);

        if (bookings.length === 0) {
            console.log("No bookings in localStorage");
            displayBookings([]);
            return;
        }

        const res = await fetch('/data/properties.json');

        if (!res.ok) {
            throw new Error("Failed to load properties.json");
        }

        const properties = await res.json();

        const userBookings = bookings
            .filter(b => b.userId === userId)
            .map(b => {
                const property = properties.find(p => p.id === b.propertyId);

                return {
                    ...b,
                    workspace: property?.workspace || "Unknown",
                    address: property?.address || "",
                    status: "upcoming"
                };
            });

        console.log("User bookings:", userBookings);

        allBookings = userBookings;

        displayBookings(userBookings);
        updateSummary(userBookings);

    } catch (err) {
        console.error("loadBookings error:", err);
    }
}

function displayBookings(bookings) {
    const container = document.getElementById("bookings-list");

    if (!container) return;

    container.innerHTML = "";

    if (bookings.length === 0) {
        container.innerHTML = "<p>No bookings found.</p>";
        return;
    }

    bookings.forEach(b => {
        const div = document.createElement("div");
        div.className = "booking";

        div.innerHTML = `
                <div class="booking-content">
                    <div class="image-placeholder"></div>

                    <div class="details">
                        <h3>${b.workspace}</h3>
                        <p class="location">${b.address}</p>
                        <p>${b.date} at ${b.startTime}</p>
                        <p>Status: ${b.status}</p>

                        <button onclick="cancelBooking(${b.id})">Cancel Booking</button>
                    </div>
                </div>
            `;

        container.appendChild(div);
    });
}

function cancelBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

    const updatedBookings = bookings.filter(b => b.id !== bookingId);

    localStorage.setItem("bookings", JSON.stringify(updatedBookings));

    alert("Booking cancelled");

    loadBookings(); // refresh UI
}

document.addEventListener("DOMContentLoaded", () => {
    updateAuthButton();
    // Load saved payment methods and render them if on the profile page
    paymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    renderPaymentMethods();
    // Load saved personal info if on the profile page
    loadPersonalInfo();
    // Load saved properties if on the profile page
    properties = JSON.parse(localStorage.getItem('ownerProperties') || '[]');
    renderProperties();
});

function renderCalendarSlots() {
    const dateInput = document.getElementById("bookingDate");
    const container = document.getElementById("calendar-slots");

    if (!dateInput || !container) return;

    const date = dateInput.value;
    if (!date) return;

    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const propertyId = parseInt(new URLSearchParams(window.location.search).get("id"));

    const propertyBookings = bookings.filter(
        b => b.propertyId === propertyId && b.date === date
    );

    container.innerHTML = "<h4>Booked Time Slots:</h4>";

    if (propertyBookings.length === 0) {
        container.innerHTML += "<p>No bookings for this date.</p>";
        return;
    }

    propertyBookings.forEach(b => {
        const div = document.createElement("div");
        div.className = "slot";
        div.textContent = `${b.startTime} for ${b.duration}h`;
        container.appendChild(div);
    });
}

// ===== PERSONAL INFORMATION =====

function savePersonalInfo() {
    const info = {
        phone: document.getElementById('profile-phone')?.value || '',
        email: document.getElementById('profile-email')?.value || '',
        address: document.getElementById('profile-address')?.value || '',
        city: document.getElementById('profile-city')?.value || '',
        zip: document.getElementById('profile-zip')?.value || '',
        province: document.getElementById('profile-province')?.value || '',
        country: document.getElementById('profile-country')?.value || ''
    };
    localStorage.setItem('personalInfo', JSON.stringify(info));
    setPersonalInfoMode('view');
}

function editPersonalInfo() {
    setPersonalInfoMode('edit');
}

function setPersonalInfoMode(mode) {
    const inputs = document.querySelectorAll('.personal-info-input');
    const btn = document.getElementById('personal-info-btn');
    if (!btn) return;

    if (mode === 'view') {
        inputs.forEach(el => el.disabled = true);
        btn.textContent = 'Edit';
        btn.onclick = editPersonalInfo;
    } else {
        inputs.forEach(el => el.disabled = false);
        btn.textContent = 'Save';
        btn.onclick = savePersonalInfo;
    }
}

function loadPersonalInfo() {
    const saved = JSON.parse(localStorage.getItem('personalInfo') || 'null');
    if (!saved) return;

    const phone = document.getElementById('profile-phone');
    const email = document.getElementById('profile-email');
    const address = document.getElementById('profile-address');
    const city = document.getElementById('profile-city');
    const zip = document.getElementById('profile-zip');
    const province = document.getElementById('profile-province');
    const country = document.getElementById('profile-country');

    if (!phone) return; // not on profile page

    phone.value = saved.phone || '';
    email.value = saved.email || '';
    address.value = saved.address || '';
    city.value = saved.city || '';
    zip.value = saved.zip || '';
    province.value = saved.province || '';
    country.value = saved.country || '';

    setPersonalInfoMode('view');
}

// ===== PAYMENT METHOD MODAL =====

let paymentMethods = [];
let editingPaymentIndex = null;

function openPaymentModal(editIndex) {
    editingPaymentIndex = (editIndex !== undefined) ? editIndex : null;

    const title = document.querySelector('.payment-modal-header h3');
    const confirmBtn = document.querySelector('.payment-confirm-btn');
    const deleteBtn = document.getElementById('payment-delete-btn');

    // Reset form to defaults
    document.querySelector('input[name="payment-type"][value="credit-card"]').checked = true;
    document.getElementById('payment-card-number').value = '';
    document.getElementById('payment-expiry').value = '';
    document.getElementById('payment-cvc').value = '';
    document.getElementById('payment-paypal-email').value = '';
    toggleCardFields();

    if (editingPaymentIndex !== null) {
        // Pre-fill for editing
        title.textContent = 'Edit Payment Method';
        confirmBtn.textContent = 'Save';
        deleteBtn.style.display = 'block';
        const m = paymentMethods[editingPaymentIndex];
        if (m.type === 'credit-card') {
            document.querySelector('input[name="payment-type"][value="credit-card"]').checked = true;
            document.getElementById('payment-card-number').value = m.cardNumber;
            document.getElementById('payment-expiry').value = m.expiry;
        } else {
            document.querySelector('input[name="payment-type"][value="paypal"]').checked = true;
            document.getElementById('payment-paypal-email').value = m.email;
        }
        toggleCardFields();
    } else {
        title.textContent = 'Add a Payment Method';
        confirmBtn.textContent = 'Add';
        deleteBtn.style.display = 'none';
    }

    document.getElementById("payment-overlay").classList.add("active");
}

function deletePaymentMethod() {
    const confirmed = confirm("Are you sure you want to delete it?");
    if (confirmed) {
        paymentMethods.splice(editingPaymentIndex, 1);
        localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
        renderPaymentMethods();
        closePaymentModal();
    }
    // If cancelled, stay in the modal
}

function closePaymentModal() {
    document.getElementById("payment-overlay").classList.remove("active");
}

function handleOverlayClick(event) {
    // Close if user clicks the backdrop (not the modal itself)
    if (event.target === document.getElementById("payment-overlay")) {
        closePaymentModal();
    }
}

function toggleCardFields() {
    const selected = document.querySelector('input[name="payment-type"]:checked').value;
    document.getElementById("payment-card-fields").style.display =
        selected === "credit-card" ? "flex" : "none";
    document.getElementById("payment-paypal-fields").style.display =
        selected === "paypal" ? "flex" : "none";
}

function savePaymentMethod() {
    const type = document.querySelector('input[name="payment-type"]:checked').value;
    let method;

    if (type === 'credit-card') {
        const cardNumber = document.getElementById('payment-card-number').value.trim();
        const expiry = document.getElementById('payment-expiry').value.trim();
        const cvc = document.getElementById('payment-cvc').value.trim();
        if (!cardNumber || !expiry || !cvc) return;
        method = {
            type: 'credit-card',
            cardNumber,
            last4: cardNumber.replace(/\s/g, '').slice(-4),
            expiry
        };
    } else {
        const email = document.getElementById('payment-paypal-email').value.trim();
        if (!email) return;
        method = { type: 'paypal', email };
    }

    if (editingPaymentIndex !== null) {
        paymentMethods[editingPaymentIndex] = method;
    } else {
        paymentMethods.push(method);
    }

    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
    renderPaymentMethods();
    closePaymentModal();
}

function renderPaymentMethods() {
    const list = document.getElementById('payment-methods-list');
    const subsection = document.getElementById('payment-methods-subsection');
    const addBtn = document.getElementById('payment-add-btn');

    if (!list) return;

    if (paymentMethods.length === 0) {
        subsection.style.display = 'none';
        if (addBtn) addBtn.textContent = '+ Add Payment Method';
        return;
    }

    subsection.style.display = 'block';

    const creditCardCount = paymentMethods.filter(m => m.type === 'credit-card').length;
    if (addBtn) {
        if (creditCardCount >= 3) {
            addBtn.textContent = 'Limit of payment method reached';
            addBtn.disabled = true;
        } else {
            addBtn.textContent = '+ Add more payment methods';
            addBtn.disabled = false;
        }
    }

    list.innerHTML = '';
    paymentMethods.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'payment-saved-item';
        if (m.type === 'credit-card') {
            div.innerHTML = `
                    <span>Credit Card &nbsp;&bull;&bull;&bull;&bull; ${m.last4} &nbsp;&mdash;&nbsp; Exp: ${m.expiry}</span>
                    <button class="profile-action-link payment-edit-btn" onclick="openPaymentModal(${i})">Edit</button>
                `;
        } else {
            div.innerHTML = `
                    <span>PayPal &nbsp;&mdash;&nbsp; ${m.email}</span>
                    <button class="profile-action-link payment-edit-btn" onclick="openPaymentModal(${i})">Edit</button>
                `;
        }
        list.appendChild(div);
    });
}
function updateSummary(bookings) {
    const upcoming = bookings.filter(b => b.status === "upcoming");
    const pending = bookings.filter(b => b.status === "pending");
    const completed = bookings.filter(b => b.status === "completed");

    document.getElementById("all-count").textContent = bookings.length;
    document.getElementById("upcoming-count").textContent = upcoming.length;
    document.getElementById("pending-count").textContent = pending.length;
    document.getElementById("completed-count").textContent = completed.length;

    if (upcoming.length > 0) {
        document.getElementById("next-booking").textContent =
            "Next: " + upcoming[0].date;
    }
}

function filterBookings(type) {
    if (type === "all") {
        displayBookings(allBookings);
        return;
    }

    const filtered = allBookings.filter(b => b.status === type);
    displayBookings(filtered);
}

async function loadProperties() {
    try {
        const res = await fetch('/data/properties.json');

        if (!res.ok) {
            throw new Error("Failed to load properties");
        }

        const properties = await res.json();

        allProperties = properties || [];

        displayProperties(allProperties);

    } catch (err) {
        console.error("Error loading properties:", err);
        displayProperties([]);
    }
}

function displayProperties(properties) {
    const container = document.getElementById("workspace-list");

    if (!container) return;

    container.innerHTML = "";

    // SHOW MESSAGE IF EMPTY
    if (!properties || properties.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <h3>No Workplaces Available</h3>
                <p>Check back later or add a new workspace.</p>
            </div>
        `;
        return;
    }

    properties.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
                <div class="image-placeholder"></div>
                <p><strong>${p.workspace}</strong></p>
                <p>${p.address}</p>
                <p>$${p.price}/hr</p>
                <button onclick="goToDetails(${p.id})">Book Now</button>
            `;

        card.onclick = () => {
            window.location.href = `workplace-details.html?id=${p.id}`;
        };

        container.appendChild(card);
    });
}

function goToDetails(id) {
    window.location.href = `workplace-details.html?id=${id}`;
}

function handleSearch() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const dropdown = document.getElementById("searchDropdown");

    dropdown.innerHTML = "";

    if (input === "") {
        dropdown.style.display = "none";
        return;
    }

    if (!allProperties || allProperties.length === 0) {
        dropdown.style.display = "none";
        return;
    }

    const filtered = allProperties.filter(p =>
        p.workspace.toLowerCase().includes(input) ||
        p.address.toLowerCase().includes(input)
    );

    if (filtered.length === 0) {
        dropdown.style.display = "none";
        return;
    }

    filtered.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("search-item");

        div.textContent = `${p.workspace} - $${p.price}/hr`;

        div.onclick = () => {
            document.getElementById("searchInput").value = p.workspace;
            dropdown.style.display = "none";

            window.location.href = `workplace-details.html?id=${p.id}`;
        };

        dropdown.appendChild(div);
    });

    dropdown.style.display = "block";
}

function loadPropertyDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));

    if (!id) {
        console.error("No property ID found in URL");
        return;
    }

    fetch('/data/properties.json')
        .then(res => res.json())
        .then(properties => {
            const property = properties.find(p => p.id === id);

            if (!property) {
                document.querySelector(".details-container").innerHTML =
                    "<p>Property not found</p>";
                return;
            }

            renderPropertyDetails(property);
        })
        .catch(err => {
            console.error(err);
        });
}

let currentPropertyPrice = 0;

function renderPropertyDetails(p) {
    currentPropertyPrice = p.price;

    document.querySelector(".details-left h2").textContent = p.workspace;
    document.querySelector(".location").textContent = p.address;

    // Owner
    document.getElementById("ownerName").textContent = p.owner;
    document.getElementById("ownerRole").textContent = "Host";

    // Description
    const descEl = document.getElementById("propertyDescription");
    if (descEl) {
        descEl.textContent = p.description || "No description available.";
    }

    // Amenities
    const amenitiesContainer = document.getElementById("amenitiesList");
    if (amenitiesContainer) {
        amenitiesContainer.innerHTML = "";

        if (p.amenities && p.amenities.length > 0) {
            p.amenities.forEach(item => {
                const div = document.createElement("div");
                div.className = "amenity";

                div.innerHTML = `
                        <span></span>
                        <p>${item}</p>
                    `;

                amenitiesContainer.appendChild(div);
            });
        } else {
            amenitiesContainer.innerHTML = "<p>No amenities listed.</p>";
        }
    }

    updatePricing();
}

function updatePricing() {
    const hours = parseInt(document.getElementById("duration").value);

    if (!hours || !currentPropertyPrice) return;

    const baseCost = currentPropertyPrice * hours;
    const serviceFee = baseCost * 0.03;
    const total = baseCost + serviceFee;

    // Update UI
    const priceBox = document.querySelector(".price-box");

    priceBox.innerHTML = `
            <p>$${currentPropertyPrice} × ${hours} hours <span>$${baseCost.toFixed(2)}</span></p>
            <p>Service fee (3%) <span>$${serviceFee.toFixed(2)}</span></p>
            <hr>
            <p><strong>Total</strong> <strong>$${total.toFixed(2)}</strong></p>
        `;
}

async function bookNow() {
    const userId = localStorage.getItem("userId");

    const params = new URLSearchParams(window.location.search);
    const propertyId = parseInt(params.get("id"));

    const date = document.getElementById("bookingDate").value;
    const startTime = document.getElementById("startTime").value;
    const duration = parseInt(document.getElementById("duration").value);

    if (!userId) {
        alert("Please log in first");
        return;
    }

    if (!date || !startTime || !duration) {
        alert("Please fill in all booking details");
        return;
    }

    let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

    // ===== PREVENT DOUBLE BOOKING =====
    function timeToMinutes(time) {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    }

    const conflict = bookings.find(b => {
        if (Number(b.propertyId) !== propertyId) return false;
        if (b.date !== date) return false;

        const existingStart = timeToMinutes(b.startTime);
        const existingEnd = existingStart + (b.duration * 60);

        const newStart = timeToMinutes(startTime);
        const newEnd = newStart + (duration * 60);

        return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
        alert("This time slot is already booked");
        return;
    }

    // ===== SAVE BOOKING =====
    const newBooking = {
        id: Date.now(),
        userId: parseInt(userId),
        propertyId,
        date,
        startTime,
        duration
    };

    bookings.push(newBooking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    // SAVE CONFIRMATION DATA
    localStorage.setItem("lastBooking", JSON.stringify(newBooking));

    // REDIRECT TO CONFIRMATION PAGE
    window.location.href = "booking-confirmation.html";
}

async function loadBookingConfirmation() {
    const booking = JSON.parse(localStorage.getItem("lastBooking"));

    if (!booking) {
        console.error("No booking found");
        return;
    }

    const container = document.getElementById("confirmation-info");
    if (!container) return;

    try {
        const res = await fetch('/data/properties.json');
        const properties = await res.json();

        const property = properties.find(p => p.id === booking.propertyId);

        const workspace = property?.workspace || "Unknown";
        const owner = property?.owner || "N/A";
        const location = property?.address || "N/A";

        const start = booking.startTime;
        const end = calculateEndTime(start, booking.duration);

        container.innerHTML = `
            <p><strong>Workspace:</strong> ${workspace}</p>
            <p><strong>Property:</strong> ${owner}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${formatTime(start)} – ${formatTime(end)}</p>
        `;

        localStorage.removeItem("lastBooking");

    } catch (err) {
        console.error("Error loading confirmation:", err);
    }
}

function calculateEndTime(startTime, duration) {
    const [h, m] = startTime.split(":").map(Number);
    let totalMinutes = h * 60 + m + (duration * 60);

    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;

    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function formatTime(time) {
    let [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    h = h ? h : 12;

    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

document.addEventListener("DOMContentLoaded", () => {
    updateAuthButton();

    if (document.getElementById("workspace-list")) {
        loadProperties();
    }

    if (document.getElementById("bookings-list")) {
        loadBookings();
    }

    if (document.getElementById("confirmation-info")) {
        loadBookingConfirmation();
    }

    // Load saved payment methods and render them if on the profile page
    paymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    renderPaymentMethods();
    // Load saved personal info if on the profile page
    loadPersonalInfo();

    const durationSelect = document.getElementById("duration");
    if (durationSelect) {
        durationSelect.addEventListener("change", updatePricing);
    }

    const bookBtn = document.getElementById("bookNowBtn");
    if (bookBtn) {
        bookBtn.addEventListener("click", bookNow);
    }

    const dateInput = document.getElementById("bookingDate");
    if (dateInput) {
        dateInput.addEventListener("change", renderCalendarSlots);
    }

    renderCalendarSlots();
});

// ===== PROPERTIES =====

function addProperty() {
    const address = document.getElementById('prop-address')?.value.trim();
    const neighbourhood = document.getElementById('prop-neighbourhood')?.value.trim();
    const sqft = document.getElementById('prop-sqft')?.value.trim();
    const parking = document.getElementById('prop-parking')?.checked;
    const transit = document.getElementById('prop-transit')?.checked;

    if (!address || !sqft) return;

    properties.push({ address, neighbourhood, sqft, parking, transit });
    localStorage.setItem('ownerProperties', JSON.stringify(properties));

    // Clear form
    document.getElementById('prop-address').value = '';
    document.getElementById('prop-neighbourhood').value = '';
    document.getElementById('prop-sqft').value = '';
    document.getElementById('prop-parking').checked = false;
    document.getElementById('prop-transit').checked = false;

    renderProperties();
}

function renderProperties() {
    const tbody = document.getElementById('properties-tbody');
    const table = document.getElementById('properties-table');
    const noMsg = document.getElementById('no-properties-msg');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (properties.length === 0) {
        if (table) table.style.display = 'none';
        if (noMsg) noMsg.style.display = 'block';
        return;
    }

    if (table) table.style.display = 'table';
    if (noMsg) noMsg.style.display = 'none';

    properties.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.address}</td>
            <td>${p.neighbourhood || '—'}</td>
            <td>${p.sqft}</td>
            <td><a href="#" class="profile-action-link" onclick="openPropertyModal(${i}); return false;">Edit</a></td>
        `;
        tbody.appendChild(tr);
    });
}

function openPropertyModal(index) {
    editingPropertyIndex = index;
    const p = properties[index];

    document.getElementById('edit-prop-address').value = p.address;
    document.getElementById('edit-prop-neighbourhood').value = p.neighbourhood || '';
    document.getElementById('edit-prop-sqft').value = p.sqft;
    document.getElementById('edit-prop-parking').checked = p.parking || false;
    document.getElementById('edit-prop-transit').checked = p.transit || false;

    document.getElementById('property-overlay').classList.add('active');
}

function closePropertyModal() {
    document.getElementById('property-overlay').classList.remove('active');
}

function handlePropertyOverlayClick(event) {
    if (event.target === document.getElementById('property-overlay')) {
        closePropertyModal();
    }
}

function savePropertyEdit() {
    const address = document.getElementById('edit-prop-address').value.trim();
    const neighbourhood = document.getElementById('edit-prop-neighbourhood').value.trim();
    const sqft = document.getElementById('edit-prop-sqft').value.trim();
    const parking = document.getElementById('edit-prop-parking').checked;
    const transit = document.getElementById('edit-prop-transit').checked;

    if (!address || !sqft) return;

    properties[editingPropertyIndex] = { address, neighbourhood, sqft, parking, transit };
    localStorage.setItem('ownerProperties', JSON.stringify(properties));
    renderProperties();
    closePropertyModal();
}

function deleteProperty() {
    const confirmed = confirm("Are you sure you want to delete it?");
    if (confirmed) {
        properties.splice(editingPropertyIndex, 1);
        localStorage.setItem('ownerProperties', JSON.stringify(properties));
        renderProperties();
        closePropertyModal();
    }
    // If no, stay in modal
}