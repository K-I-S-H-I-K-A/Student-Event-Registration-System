// ===== GLOBAL STATE VARIABLES =====
let allBookings = [];
let allProperties = [];
let properties = [];
let editingPropertyIndex = null;
let paymentMethods = [];
let editingPaymentIndex = null;

// ===== LOGIN FUNCTION =====
function login() {
    const email = document.getElementById("email").value; // get email input
    const password = document.getElementById("password").value; // get password input

    if (!email || !password) {
        alert("Please fill in all required fields.");
        return;
    }

    // send login request to backend
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // send credentials as JSON
    })
        .then(res => res.json()) // parse response
        .then(data => {
            if (data.success) {
                alert("Login successful!");

                // store logged-in user ID, name and role in localStorage
                localStorage.setItem("userId", data.id);
                if (data.name) localStorage.setItem("userName", data.name);
                if (data.role) localStorage.setItem("userRole", data.role);

                // redirect to home page
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

// ===== REGISTER FUNCTION =====
function registerUser() {
    // collect user input into an object
    const user = {
        email: document.getElementById("email").value,
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
    };

    if (!user.email || !user.name || !user.phone || !user.password) {
        alert("Please fill in all required fields.");
        return;
    }

    // send registration request
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Account created!");

                // redirect to login page after successful registration
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

// ===== PROFILE GUARD =====
function goToProfile() {
    const userId = localStorage.getItem("userId");
    if (userId && userId !== "0") {
        window.location.href = "profile.html";
    } else {
        alert("You need to be logged in to view your profile.");
        window.location.href = "login.html";
    }
}

// ===== UPDATE AUTH BUTTON UI =====
function updateAuthButton() {
    const authBtn = document.getElementById("auth-btn"); // auth button element
    const userId = localStorage.getItem("userId"); // check login state

    if (!authBtn) return;

    // if user is logged in, show logout, otherwise sign in
    if (userId && userId !== "0") {
        authBtn.textContent = "Logout";
    } else {
        authBtn.textContent = "Sign In";
    }
}

// ===== HANDLE LOGIN/LOGOUT BUTTON =====
function handleAuth() {
    const userId = localStorage.getItem("userId");

    if (userId && userId !== "0") {
        // logout: remove user from storage
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");

        updateAuthButton();

        // redirect to home page if logging out from profile, otherwise reload
        if (window.location.pathname.includes("profile.html")) {
            window.location.href = "index.html";
        } else {
            window.location.reload();
        }
    } else {
        // redirect to login page if not logged in
        window.location.href = "login.html";
    }
}

// ===== LOAD BOOKINGS FOR LOGGED USER =====
async function loadBookings() {
    try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            console.log("No user logged in");
            return;
        }

        const res = await fetch(`/data/bookings?userId=${userId}`);
        const bookings = await res.json();

        const propertyRes = await fetch('/data/properties');
        const properties = await propertyRes.json();

        allBookings = bookings;
        allProperties = properties;

        const sortedBookings = [...bookings].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        displayBookings(sortedBookings);
        updateSummary(bookings);

    } catch (err) {
        console.error("loadBookings error:", err);
    }
}

function updateSummary(bookings) {
    if (!bookings) return;

    // ALL
    document.getElementById("all-count").innerText = bookings.length;

    // UPCOMING
    const upcoming = bookings.filter(b => b.status === "upcoming");
    document.getElementById("upcoming-count").innerText = upcoming.length;

    // AMENITIES / NO AMENITIES (based on property)
    const withAmenities = bookings.filter(b => {
        const property = allProperties.find(p => p.id === b.propertyId);
        return property && property.amenities && property.amenities.length > 0;
    });

    const withoutAmenities = bookings.filter(b => {
        const property = allProperties.find(p => p.id === b.propertyId);
        return !property || !property.amenities || property.amenities.length === 0;
    });

    document.getElementById("amenities-count").innerText = withAmenities.length;
    document.getElementById("no-amenities-count").innerText = withoutAmenities.length;

    // NEXT BOOKING (optional but keep)
    const nextBookingEl = document.getElementById("next-booking");

    if (upcoming.length > 0) {
        nextBookingEl.innerText = "Next: " + upcoming[0].date;
    } else {
        nextBookingEl.innerText = "Next: -";
    }
}

function filterBookings(type) {
    let filtered = [...allBookings];

    if (type === "all") {
        filtered = allBookings;
    }

    else if (type === "upcoming") {
        filtered = filtered.filter(b => b.status === "upcoming");
    }

    else if (type === "amenities") {
        filtered = filtered.filter(b => {
            const property = allProperties.find(p => p.id === b.propertyId);
            return property && property.amenities && property.amenities.length > 0;
        });
    }

    else if (type === "no-amenities") {
        filtered = filtered.filter(b => {
            const property = allProperties.find(p => p.id === b.propertyId);
            return !property || property.amenities.length === 0;
        });
    }

    const sorted = [...filtered].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    displayBookings(sorted);
}

// ===== DISPLAY BOOKINGS IN UI =====
function displayBookings(bookings) {
    const container = document.getElementById("bookings-list");

    if (!container) return;

    container.innerHTML = "";

    if (bookings.length === 0) {
        container.innerHTML = "<p>No bookings found.</p>";
        return;
    }

    // create UI cards for each booking
    bookings.forEach(b => {
        const div = document.createElement("div");
        div.className = "booking";
        div.id = `booking-${b.id}`;

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

// ===== CANCEL BOOKING =====
async function cancelBooking(bookingId) {
    const confirmed = confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    try {
        const res = await fetch(`/bookings/${bookingId}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
            // Remove the booking card from the page
            const card = document.getElementById(`booking-${bookingId}`);
            if (card) card.remove();

            // Remove from in-memory array and update summary counts live
            allBookings = allBookings.filter(b => b.id !== bookingId);
            updateSummary(allBookings);
        } else {
            alert("Failed to cancel booking");
        }
    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

// ===== PROFILE ROLE DISPLAY =====
function applyProfileRole() {
    const roleLabel = document.getElementById("profile-role-label");
    if (!roleLabel) return; // not on profile page

    const role = localStorage.getItem("userRole") || "coworker";

    // Update the role label
    roleLabel.textContent = role.charAt(0).toUpperCase() + role.slice(1);

    // Hide owner-only sections for coworkers
    if (role !== "owner") {
        const addSection = document.getElementById("add-property-section");
        const yourSection = document.getElementById("your-properties-section");
        if (addSection) addSection.style.display = "none";
        if (yourSection) yourSection.style.display = "none";
    }
}

async function renderCalendarSlots() {
    const dateInput = document.getElementById("bookingDate");
    const container = document.getElementById("calendar-slots");

    if (!dateInput || !container) return;

    const date = dateInput.value;
    if (!date) return;

    const propertyId = parseInt(new URLSearchParams(window.location.search).get("id"));

    try {
        const res = await fetch('/data/bookings');
        const bookings = await res.json();

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

    } catch (err) {
        console.error(err);
    }
}

// ===== PERSONAL INFO FUNCTIONS =====

// save user profile info to localStorage
function savePersonalInfo() {
    const userId = localStorage.getItem('userId');
    const info = {
        name: document.getElementById('profile-name')?.value || '',
        phone: document.getElementById('profile-phone')?.value || '',
        email: document.getElementById('profile-email')?.value || '',
        address: document.getElementById('profile-address')?.value || '',
        city: document.getElementById('profile-city')?.value || '',
        zip: document.getElementById('profile-zip')?.value || '',
        province: document.getElementById('profile-province')?.value || '',
        country: document.getElementById('profile-country')?.value || ''
    };
    localStorage.setItem(`personalInfo_${userId}`, JSON.stringify(info));
    setPersonalInfoMode('view');
}

// switch to edit mode
function editPersonalInfo() {
    setPersonalInfoMode('edit');
}

// toggle between view/edit mode
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

// load saved personal info into form
function loadPersonalInfo() {
    const userId = localStorage.getItem('userId');
    const saved = JSON.parse(localStorage.getItem(`personalInfo_${userId}`) || 'null');

    const nameField = document.getElementById('profile-name');
    if (!nameField) return; // not on profile page

    // Get name from saved info or localStorage, falling back to server fetch
    const storedName = localStorage.getItem('userName');
    const validStoredName = storedName && storedName !== 'undefined' ? storedName : null;
    const resolvedName = saved?.name || validStoredName;

    if (resolvedName) {
        nameField.value = resolvedName;
    } else if (userId) {
        // Fetch name from server for users who logged in before name was stored
        fetch(`/user?id=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.name) {
                    localStorage.setItem('userName', data.name);
                    nameField.value = data.name;
                }
            })
            .catch(() => {});
    }

    if (!saved) return;

    const phone = document.getElementById('profile-phone');
    if (!phone) return;
    phone.value = saved.phone || '';
    document.getElementById('profile-email').value = saved.email || '';
    document.getElementById('profile-address').value = saved.address || '';
    document.getElementById('profile-city').value = saved.city || '';
    document.getElementById('profile-zip').value = saved.zip || '';
    document.getElementById('profile-province').value = saved.province || '';
    document.getElementById('profile-country').value = saved.country || '';

    setPersonalInfoMode('view');
}

// ===== PROPERTIES =====

async function loadOwnerProperties() {
    const tbody = document.getElementById('properties-tbody');
    if (!tbody) return;

    const userId = parseInt(localStorage.getItem('userId'));

    try {
        const res = await fetch('/data/properties');
        const all = await res.json();
        properties = all.filter(p => p.ownerId === userId);
        renderProperties();
    } catch (err) {
        console.error('Error loading owner properties:', err);
    }
}

async function addProperty() {
    const address = document.getElementById('prop-address')?.value.trim();
    const neighbourhood = document.getElementById('prop-neighbourhood')?.value.trim();
    const sqft = document.getElementById('prop-sqft')?.value.trim();
    const price = parseFloat(document.getElementById('prop-price')?.value) || 0;
    const parking = document.getElementById('prop-parking')?.checked;
    const transit = document.getElementById('prop-transit')?.checked;

    if (!address || !sqft) return;

    const amenities = [];
    if (parking) amenities.push('Parking Space');
    if (transit) amenities.push('Public Transport');

    const newProperty = {
        workspace: address,
        address,
        neighbourhood,
        sqft,
        parking,
        transit,
        amenities,
        ownerId: parseInt(localStorage.getItem('userId')) || null,
        owner: '',
        price,
        description: '',
        status: 'Not Booked'
    };

    try {
        const res = await fetch('/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProperty)
        });
        const data = await res.json();

        if (data.success) {
            properties.push(data.property);

            // Clear form
            document.getElementById('prop-address').value = '';
            document.getElementById('prop-neighbourhood').value = '';
            document.getElementById('prop-sqft').value = '';
            document.getElementById('prop-price').value = '';
            document.getElementById('prop-parking').checked = false;
            document.getElementById('prop-transit').checked = false;

            renderProperties();
        }
    } catch (err) {
        console.error('Error adding property:', err);
    }
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
            <td>${p.price ? '$' + p.price + '/hr' : '—'}</td>
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
    document.getElementById('edit-prop-price').value = p.price != null ? p.price : '';
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

async function savePropertyEdit() {
    const address = document.getElementById('edit-prop-address').value.trim();
    const neighbourhood = document.getElementById('edit-prop-neighbourhood').value.trim();
    const sqft = document.getElementById('edit-prop-sqft').value.trim();
    const price = parseFloat(document.getElementById('edit-prop-price').value) || 0;
    const parking = document.getElementById('edit-prop-parking').checked;
    const transit = document.getElementById('edit-prop-transit').checked;

    if (!address || !sqft) return;

    const amenities = [];
    if (parking) amenities.push('Parking Space');
    if (transit) amenities.push('Public Transport');

    const p = properties[editingPropertyIndex];
    const updated = { address, neighbourhood, sqft, price, parking, transit, amenities, workspace: address };

    try {
        const res = await fetch(`/properties/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        const data = await res.json();

        if (data.success) {
            properties[editingPropertyIndex] = { ...p, ...updated };
            renderProperties();
            closePropertyModal();
        }
    } catch (err) {
        console.error('Error saving property edit:', err);
    }
}

async function deleteProperty() {
    const confirmed = confirm("Are you sure you want to delete it?");
    if (confirmed) {
        const p = properties[editingPropertyIndex];

        try {
            const res = await fetch(`/properties/${p.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                properties.splice(editingPropertyIndex, 1);
                renderProperties();
                closePropertyModal();
            }
        } catch (err) {
            console.error('Error deleting property:', err);
        }
    }
    // If no, stay in modal
}

// ===== PAYMENT METHOD FUNCTIONS =====

function renderPaymentMethods() {
    const list = document.getElementById('payment-methods-list');
    if (!list) return;

    list.innerHTML = '';

    paymentMethods.forEach((method, i) => {
        const div = document.createElement('div');
        div.className = 'payment-saved-item';
        div.innerHTML = method.type === 'credit-card'
            ? `<span>Credit Card •••• •••• •••• ${method.cardNumber.slice(-4)}</span> <a href="#" class="profile-action-link" onclick="openPaymentModal(${i}); return false;">Edit</a>`
            : `<span>PayPal — ${method.paypalEmail}</span> <a href="#" class="profile-action-link" onclick="openPaymentModal(${i}); return false;">Edit</a>`;
        list.appendChild(div);
    });

    // Show/hide the subsection and update button label
    const subsection = document.getElementById('payment-methods-subsection');
    const addBtn = document.getElementById('payment-add-btn');
    if (subsection) subsection.style.display = paymentMethods.length > 0 ? 'block' : 'none';
    if (addBtn) {
        if (paymentMethods.length >= 3) {
            addBtn.textContent = 'Payment method limit reached';
            addBtn.disabled = true;
        } else {
            addBtn.textContent = paymentMethods.length > 0 ? '+ Add More Payment Methods' : '+ Add Payment Method';
            addBtn.disabled = false;
        }
    }
}

function openPaymentModal(index) {
    // Block adding new when limit reached (editing existing is still allowed)
    if (index === undefined && paymentMethods.length >= 3) return;

    const overlay = document.getElementById('payment-overlay');
    const deleteBtn = document.getElementById('payment-delete-btn');
    const confirmBtn = overlay.querySelector('.payment-confirm-btn');

    if (index !== undefined) {
        // Edit existing
        editingPaymentIndex = index;
        const method = paymentMethods[index];
        overlay.querySelector('h3').textContent = 'Edit Payment Method';
        confirmBtn.textContent = 'Save';
        deleteBtn.style.display = 'block';

        if (method.type === 'credit-card') {
            overlay.querySelector('input[value="credit-card"]').checked = true;
            document.getElementById('payment-card-number').value = method.cardNumber;
            document.getElementById('payment-expiry').value = method.expiry;
            document.getElementById('payment-cvc').value = method.cvc;
        } else {
            overlay.querySelector('input[value="paypal"]').checked = true;
            document.getElementById('payment-paypal-email').value = method.paypalEmail;
        }
        toggleCardFields();
    } else {
        // Add new
        editingPaymentIndex = null;
        overlay.querySelector('h3').textContent = 'Add a Payment Method';
        confirmBtn.textContent = 'Add';
        deleteBtn.style.display = 'none';
        overlay.querySelector('input[value="credit-card"]').checked = true;
        document.getElementById('payment-card-number').value = '';
        document.getElementById('payment-expiry').value = '';
        document.getElementById('payment-cvc').value = '';
        document.getElementById('payment-paypal-email').value = '';
        toggleCardFields();
    }

    overlay.classList.add('active');
}

function closePaymentModal() {
    document.getElementById('payment-overlay').classList.remove('active');
}

function handleOverlayClick(event) {
    if (event.target === document.getElementById('payment-overlay')) {
        closePaymentModal();
    }
}

function toggleCardFields() {
    const type = document.querySelector('input[name="payment-type"]:checked').value;
    document.getElementById('payment-card-fields').style.display = type === 'credit-card' ? 'block' : 'none';
    document.getElementById('payment-paypal-fields').style.display = type === 'paypal' ? 'block' : 'none';
}

function savePaymentMethod() {
    const type = document.querySelector('input[name="payment-type"]:checked').value;
    let method;

    if (type === 'credit-card') {
        const cardNumber = document.getElementById('payment-card-number').value.trim();
        const expiry = document.getElementById('payment-expiry').value.trim();
        const cvc = document.getElementById('payment-cvc').value.trim();
        if (!cardNumber || !expiry || !cvc) {
            alert('Please fill in all card fields.');
            return;
        }
        method = { type: 'credit-card', cardNumber, expiry, cvc };
    } else {
        const paypalEmail = document.getElementById('payment-paypal-email').value.trim();
        if (!paypalEmail) {
            alert('Please enter your PayPal email.');
            return;
        }
        method = { type: 'paypal', paypalEmail };
    }

    if (editingPaymentIndex !== null) {
        paymentMethods[editingPaymentIndex] = method;
    } else {
        paymentMethods.push(method);
    }

    const userId = localStorage.getItem('userId');
    localStorage.setItem(`paymentMethods_${userId}`, JSON.stringify(paymentMethods));
    renderPaymentMethods();
    closePaymentModal();
}

function deletePaymentMethod() {
    if (editingPaymentIndex === null) return;
    const confirmed = confirm('Remove this payment method?');
    if (!confirmed) return;

    paymentMethods.splice(editingPaymentIndex, 1);
    const userId = localStorage.getItem('userId');
    localStorage.setItem(`paymentMethods_${userId}`, JSON.stringify(paymentMethods));
    renderPaymentMethods();
    closePaymentModal();
}

// ===== HOME PAGE FUNCTIONS =====

async function loadAllProperties() {
    const container = document.getElementById('workspace-list');
    if (!container) return;

    try {
        const res = await fetch('/data/properties');
        allProperties = await res.json();
        renderWorkspaceCards(allProperties);
    } catch (err) {
        console.error('Error loading properties:', err);
    }
}

function renderWorkspaceCards(list) {
    const container = document.getElementById('workspace-list');
    if (!container) return;

    container.innerHTML = '';

    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div class="image-placeholder"></div>

            <p><strong>${p.workspace || p.address}</strong></p>
            <p>${p.address}</p>

            <p><strong>Size:</strong> ${p.sqft} sqft</p>

            <p><strong>$${p.price}/hr</strong></p>

            <button class="book-now-btn" onclick="goToWorkspace(${p.id})">
                Book Now
            </button>
        `;

        container.appendChild(card);
    });
}

function goToWorkspace(id) {
    window.location.href = `workplace-details.html?id=${id}`;
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = allProperties.filter(p =>
        (p.address || '').toLowerCase().includes(query) ||
        (p.workspace || '').toLowerCase().includes(query) ||
        (p.neighbourhood || '').toLowerCase().includes(query)
    );
    renderWorkspaceCards(filtered);
}

function applyAdvancedFilter() {
    let filtered = [...allProperties];

    const amenity = document.getElementById("amenityFilter")?.value;
    const neighbourhood = document.getElementById("neighbourhoodFilter")?.value;

    const sqftCondition = document.getElementById("sqftCondition")?.value;
    const sqftValue = parseFloat(document.getElementById("sqftValue")?.value);

    const priceCondition = document.getElementById("priceCondition")?.value;
    const priceValue = parseFloat(document.getElementById("priceValue")?.value);

    // Amenity filter
    if (amenity) {
        filtered = filtered.filter(p =>
            p.amenities && p.amenities.includes(amenity)
        );
    }

    // Neighbourhood filter
    if (neighbourhood) {
        filtered = filtered.filter(p =>
            p.neighbourhood === neighbourhood
        );
    }

    // Sqft filter
    if (sqftCondition && !isNaN(sqftValue)) {
        filtered = filtered.filter(p => {
            const sqft = parseFloat(p.sqft);

            if (sqftCondition === "gt") return sqft > sqftValue;
            if (sqftCondition === "lt") return sqft < sqftValue;
            if (sqftCondition === "eq") return sqft === sqftValue;
        });
    }

    // Price filter
    if (priceCondition && !isNaN(priceValue)) {
        filtered = filtered.filter(p => {
            if (priceCondition === "gt") return p.price > priceValue;
            if (priceCondition === "lt") return p.price < priceValue;
            if (priceCondition === "eq") return p.price === priceValue;
        });
    }

    renderWorkspaceCards(filtered);
}

let selectedProperty = null;

async function loadPropertyDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));

    if (!id) return;

    const res = await fetch('/data/properties');
    const properties = await res.json();

    selectedProperty = properties.find(p => p.id === id);

    if (!selectedProperty) return;

    // Populate basic UI
    document.querySelector(".details-left h2").textContent = selectedProperty.workspace;
    document.querySelector(".location").textContent = selectedProperty.address;
    document.getElementById("propertyDescription").textContent = selectedProperty.description || "";

    // ===== AMENITIES =====
    const amenitiesList = document.getElementById("amenitiesList");

    if (amenitiesList) {
        if (selectedProperty.amenities && selectedProperty.amenities.length > 0) {
            amenitiesList.innerHTML = selectedProperty.amenities
                .map(a => `<li>${a}</li>`)
                .join("");
        } else {
            amenitiesList.innerHTML = "<p>No amenities available.</p>";
        }
    }

    // ===== OWNER NAME =====
    const ownerNameEl = document.getElementById("ownerName");

    if (ownerNameEl) {
        ownerNameEl.textContent = selectedProperty.owner
            ? selectedProperty.owner
            : "Unknown Host";
    }
    
    // Render price initially
    updatePricing();
}

function updatePricing() {
    const durationSelect = document.getElementById("duration");
    const priceBox = document.querySelector(".price-box");

    if (!durationSelect || !priceBox || !selectedProperty) return;

    const duration = parseInt(durationSelect.value);

    if (!duration) {
        priceBox.innerHTML = `
            <p>$0 x 0 hours <span>$0</span></p>
            <p>Service fee <span>$0</span></p>
            <hr>
            <p><strong>Total</strong> <strong>$0</strong></p>
        `;
        return;
    }

    const hourlyRate = selectedProperty.price;
    const subtotal = hourlyRate * duration;
    const serviceFee = subtotal * 0.03;
    const total = subtotal + serviceFee;

    priceBox.innerHTML = `
        <p>$${hourlyRate} x ${duration} hours <span>$${subtotal.toFixed(2)}</span></p>
        <p>Service fee (3%) <span>$${serviceFee.toFixed(2)}</span></p>
        <hr>
        <p><strong>Total</strong> <strong>$${total.toFixed(2)}</strong></p>
    `;
}

async function bookNow() {
    const userId = parseInt(localStorage.getItem("userId"));

    if (!userId) {
        alert("Please log in first");
        window.location.href = "login.html";
        return;
    }

    const duration = parseInt(document.getElementById("duration")?.value);
    const date = document.getElementById("bookingDate")?.value;
    const startTime = document.getElementById("startTime")?.value;

    if (!duration || !date || !startTime) {
        alert("Please select date, time, and duration");
        return;
    }

    if (!selectedProperty) {
        alert("Property not loaded");
        return;
    }

    // Pricing
    const hourlyRate = selectedProperty.price;
    const subtotal = hourlyRate * duration;
    const serviceFee = subtotal * 0.03;
    const total = subtotal + serviceFee;

    const booking = {
        userId,
        propertyId: selectedProperty.id,
        date,
        startTime,
        duration,
        hourlyRate,
        subtotal,
        serviceFee,
        total
    };

    try {
        const res = await fetch('/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });

        const data = await res.json();


        if (data.success) {
            // store locally for confirmation page
            localStorage.setItem("lastBooking", JSON.stringify(data.booking));

            // redirect
            window.location.href = `booking-confirmation.html?bookingId=${data.booking.id}`;
        } else {
            alert(data.message || "Booking failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

async function loadBookingConfirmation() {
    const saved = JSON.parse(localStorage.getItem("lastBooking"));

    if (!saved) {
        console.error("No booking found in localStorage");
        return;
    }

    try {
        const propRes = await fetch('/data/properties');
        const properties = await propRes.json();

        const property = properties.find(p => p.id === saved.propertyId);

        const container = document.getElementById("confirmation-info");

        if (!container) return;

        container.innerHTML = `
            <p><strong>Workspace:</strong> ${property?.workspace || 'N/A'}</p>
            <p><strong>Address:</strong> ${property?.address || 'N/A'}</p>
            <p><strong>Date:</strong> ${saved.date}</p>
            <p><strong>Time:</strong> ${saved.startTime}</p>
            <p><strong>Duration:</strong> ${saved.duration} hrs</p>
            <p><strong>Subtotal:</strong> $${saved.subtotal.toFixed(2)}</p>
            <p><strong>Service Fee:</strong> $${saved.serviceFee.toFixed(2)}</p>
            <p><strong>Total:</strong> <strong>$${saved.total.toFixed(2)}</strong></p>
        `;
    } catch (err) {
        console.error("Error loading confirmation:", err);
    }
}

// ===== DOM CONTENT LOADED INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
    // Remove legacy unscoped keys left over from before user-scoping was added
    localStorage.removeItem('personalInfo');
    localStorage.removeItem('paymentMethods');

    updateAuthButton();

    // Apply role-based visibility on the profile page
    applyProfileRole();

    loadPersonalInfo();

    // Load owner properties from server if on the profile page
    loadOwnerProperties();

    // Load all properties for the home page
    loadAllProperties();

    // Load property details if on the details page
    loadPropertyDetails();

    // Load booking confirmation details if on the confirmation page
    loadBookingConfirmation();

    const bookingsList = document.getElementById("bookings-list");
    if (bookingsList) {
        loadBookings();
    }

    renderCalendarSlots();

   // Load saved payment methods and render them if on the profile page
    const _userId1 = localStorage.getItem('userId');
    paymentMethods = JSON.parse(localStorage.getItem(`paymentMethods_${_userId1}`) || '[]');
    renderPaymentMethods();

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

    const filterBtn = document.getElementById("filterBtn");
    const filterMenu = document.getElementById("filterMenu");

    if (filterBtn && filterMenu) {
        filterBtn.addEventListener("click", () => {
            filterMenu.classList.toggle("hidden");
        });
    }
});