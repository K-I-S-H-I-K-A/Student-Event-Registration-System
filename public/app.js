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

                // store logged-in user ID and name in localStorage
                localStorage.setItem("userId", data.id);
                if (data.name) localStorage.setItem("userName", data.name);

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

        updateAuthButton();

        // refresh page after logout
        window.location.reload();
    } else {
        // redirect to login page if not logged in
        window.location.href = "login.html";
    }
}

// ===== LOAD BOOKINGS FOR LOGGED USER =====
async function loadBookings() {
    try {
        const userId = parseInt(localStorage.getItem("userId"));

        if (!userId) {
            console.log("No user logged in");
            return;
        }

        // get bookings from localStorage
        const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

        console.log("Stored bookings:", bookings);
        console.log("Current userId:", userId);

        if (bookings.length === 0) {
            displayBookings([]);
            return;
        }

        // fetch property data
        const res = await fetch('/data/properties.json');

        if (!res.ok) {
            throw new Error("Failed to load properties.json");
        }

        const properties = await res.json();

        // filter bookings for current user and enrich with property data
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
function cancelBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

    // remove booking by ID
    const updatedBookings = bookings.filter(b => b.id !== bookingId);

    localStorage.setItem("bookings", JSON.stringify(updatedBookings));

    alert("Booking cancelled");

    loadBookings(); // refresh UI
}

document.addEventListener("DOMContentLoaded", () => {
    // Remove legacy unscoped keys left over from before user-scoping was added
    localStorage.removeItem('personalInfo');
    localStorage.removeItem('paymentMethods');

    updateAuthButton();
    // Load saved payment methods and render them if on the profile page
    const _userId1 = localStorage.getItem('userId');
    paymentMethods = JSON.parse(localStorage.getItem(`paymentMethods_${_userId1}`) || '[]');
    renderPaymentMethods();
    // Load saved personal info if on the profile page
    loadPersonalInfo();
    // Load owner properties from server if on the profile page
    loadOwnerProperties();
    // Load all properties for the home page
    loadAllProperties();
});

function renderCalendarSlots() {
    const dateInput = document.getElementById("bookingDate");
    const container = document.getElementById("calendar-slots");

    if (!dateInput || !container) return;

    const date = dateInput.value;
    if (!date) return;

    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const propertyId = parseInt(new URLSearchParams(window.location.search).get("id"));

    // filter bookings for selected property and date
    const propertyBookings = bookings.filter(
        b => b.propertyId === propertyId && b.date === date
    );

    container.innerHTML = "<h4>Booked Time Slots:</h4>";

    if (propertyBookings.length === 0) {
        container.innerHTML += "<p>No bookings for this date.</p>";
        return;
    }

    // display booked time slots
    propertyBookings.forEach(b => {
        const div = document.createElement("div");
        div.className = "slot";
        div.textContent = `${b.startTime} for ${b.duration}h`;
        container.appendChild(div);
    });
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

// ===== DOM CONTENT LOADED INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
    updateAuthButton();

    // load profile-related data if present
    const _userId2 = localStorage.getItem('userId');
    paymentMethods = JSON.parse(localStorage.getItem(`paymentMethods_${_userId2}`) || '[]');
    renderPaymentMethods();

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

    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">No workspaces available.</p>';
        return;
    }

    list.forEach(p => {
        const card = document.createElement('a');
        card.className = 'card';
        card.href = `Workplace-details.html?id=${p.id}`;
        card.innerHTML = `
            <div class="image-placeholder"></div>
            <p><strong>${p.workspace || p.address}</strong></p>
            <p>${p.address}</p>
            <p>$${p.price}/hr</p>
        `;
        container.appendChild(card);
    });
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