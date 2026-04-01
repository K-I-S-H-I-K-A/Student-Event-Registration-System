// ===== GLOBAL STATE VARIABLES =====
let allBookings = [];
let allProperties = [];
let properties = [];
let editingPropertyIndex = null;

// ===== LOGIN FUNCTION =====
function login() {
    const email = document.getElementById("email").value; // get email input
    const password = document.getElementById("password").value; // get password input

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

                // store logged-in user ID in localStorage
                localStorage.setItem("userId", data.id);

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

    // refresh UI
    loadBookings();
}



// ===== RENDER CALENDAR SLOTS =====
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
    const saved = JSON.parse(localStorage.getItem('personalInfo') || 'null');
    if (!saved) return;

    const phone = document.getElementById('profile-phone');
    if (!phone) return; // not on profile page

    // populate fields
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
    paymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    renderPaymentMethods();

    loadPersonalInfo();

    // load owner properties
    properties = JSON.parse(localStorage.getItem('ownerProperties') || '[]');
    renderProperties();
});