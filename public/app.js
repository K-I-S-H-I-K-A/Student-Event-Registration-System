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
    const userId = localStorage.getItem("userId") || "0";

    if (!userId) {
        console.error("No userId found. User may not be logged in.");
        return;
    }

    try {
        const res = await fetch(`/api/bookings?userId=${userId}`);
        const bookings = await res.json();

        displayBookings(bookings);

    } catch (err) {
        console.error("Error fetching bookings:", err);
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
                    <p>${b.date}</p>
                    <p>Status: ${b.status}</p>
                </div>
            </div>
        `;

        container.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", updateAuthButton);