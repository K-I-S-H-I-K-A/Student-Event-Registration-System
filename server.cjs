// Import built-in Node.js modules for creating a server, handling files, and working with file paths
const http = require('http');
const fs = require('fs');
const path = require('path');

// Define the port the server will run on
const PORT = 3000;

// Define the file path to the users.json file
const usersFile = path.join(__dirname, 'public', 'data', 'users.json');

// Create the HTTP server
const server = http.createServer((req, res) => {

    // ===== REGISTER API =====
    // Handles user registration requests
    if (req.method === 'POST' && req.url === '/register') {
        let body = '';

        // Collect incoming request data chunks
        req.on('data', chunk => body += chunk);

        // When all data has been received
        req.on('end', () => {
            try {
                // Parse the incoming JSON body into a JavaScript object
                const newUser = JSON.parse(body);

                // Read existing users from the JSON file
                let users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

                // Check if a user with the same email already exists
                const exists = users.find(u => u.email === newUser.email);

                // Set response header to JSON
                res.writeHead(200, { 'Content-Type': 'application/json' });

                // If user already exists, return error response
                if (exists) {
                    return res.end(JSON.stringify({
                        success: false,
                        message: "User already exists"
                    }));
                }

                // Generate next user ID
                let nextId = 1;

                // If users exist, find the highest ID and increment it
                if (users.length > 0) {
                    nextId = Math.max(...users.map(u => u.id || 0)) + 1;
                }

                // Assign the generated ID to the new user
                newUser.id = nextId;

                // Add the new user to the users array
                users.push(newUser);

                // Write updated users list back to the JSON file
                fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

                // Send success response
                res.end(JSON.stringify({ success: true }));

            } catch (error) {
                // Handle server errors
                res.writeHead(500);
                res.end("Server Error");
            }
        });
    }

    // ===== LOGIN API =====
    // Handles user login requests
    else if (req.method === 'POST' && req.url === '/login') {
        let body = '';

        // Collect incoming request data
        req.on('data', chunk => body += chunk);

        // Process request after receiving all data
        req.on('end', () => {
            try {
                // Extract email and password from request body
                const { email, password } = JSON.parse(body);

                let users = [];

                // Safely read users file
                try {
                    const data = fs.readFileSync(usersFile, 'utf-8');
                    users = data ? JSON.parse(data) : [];
                } catch {
                    users = [];
                }

                // Find matching user
                const user = users.find(
                    u => u.email === email && u.password === password
                );

                // Set response type
                res.writeHead(200, { 'Content-Type': 'application/json' });

                // If user is found, return success with role and id
                if (user) {
                    res.end(JSON.stringify({
                        success: true,
                        role: user.role,
                        id: user.id
                    }));
                } else {
                    // Invalid credentials
                    res.end(JSON.stringify({ success: false }));
                }

            } catch (error) {
                // Handle server errors
                res.writeHead(500);
                res.end("Server Error");
            }
        });
    }

    // ===== GET BOOKINGS FOR USER =====
    // Retrieves bookings filtered by a specific user
    else if (req.method === 'GET' && req.url.startsWith('/data/bookings')) {

        // Parse query parameters from URL
        const url = new URL(req.url, `http://${req.headers.host}`);
        const userId = parseInt(url.searchParams.get('userId'));

        // Define file paths
        const bookingsFile = path.join(__dirname, 'data', 'bookings.json');
        const propertiesFile = path.join(__dirname, 'data', 'properties.json');

        try {
            // Read bookings data
            const bookingsData = fs.readFileSync(bookingsFile, 'utf-8');
            const bookings = bookingsData ? JSON.parse(bookingsData) : [];

            // Read properties data
            const propertiesData = fs.readFileSync(propertiesFile, 'utf-8');
            const properties = propertiesData ? JSON.parse(propertiesData) : [];

            // Filter bookings belonging to the user
            const userBookings = bookings.filter(b => Number(b.userId) === userId);

            // Enrich bookings with property details
            const enrichedBookings = userBookings.map(b => {
                const property = properties.find(p => p.id === b.propertyId);

                return {
                    ...b,
                    workspace: property?.workspace || "Unknown Workspace",
                    address: property?.address || "No address",
                    price: property?.price || 0,
                    owner: property?.owner || "Unknown",
                    status: "upcoming" // placeholder status
                };
            });

            // Return enriched bookings
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(enrichedBookings));

        } catch (error) {
            console.error(error);
            res.writeHead(500);
            res.end("Server Error");
        }
    }

    // ===== GET ALL PROPERTIES =====
    // Returns all available properties
    else if (req.method === 'GET' && req.url === '/data/properties') {
        const propertiesFile = path.join(__dirname, 'data', 'properties.json');

        try {
            const data = fs.readFileSync(propertiesFile, 'utf-8');
            const properties = data ? JSON.parse(data) : [];

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(properties));
        } catch {
            res.writeHead(500);
            res.end("Server Error");
        }
    }

    // ===== CREATE BOOKING =====
    // Handles booking creation requests
    else if (req.method === 'POST' && req.url === '/book') {
        let body = '';

        // Collect request body
        req.on('data', chunk => body += chunk);

        req.on('end', () => {
            try {
                // Parse booking data
                const bookingData = JSON.parse(body);

                const bookingsFile = path.join(__dirname, 'data', 'bookings.json');

                let bookings = [];

                // Read existing bookings
                try {
                    const data = fs.readFileSync(bookingsFile, 'utf-8');
                    bookings = data ? JSON.parse(data) : [];
                } catch {
                    bookings = [];
                }

                // Generate booking ID
                let nextId = 1;
                if (bookings.length > 0) {
                    nextId = Math.max(...bookings.map(b => b.id || 0)) + 1;
                }

                bookingData.id = nextId;

                // ===== PREVENT DOUBLE BOOKING =====
                // Helper to convert time string to minutes
                function timeToMinutes(time) {
                    const [h, m] = time.split(":").map(Number);
                    return h * 60 + m;
                }

                // Check for time conflicts
                const conflict = bookings.find(b => {
                    if (Number(b.propertyId) !== Number(bookingData.propertyId)) return false;
                    if (b.date !== bookingData.date) return false;

                    const existingStart = timeToMinutes(b.startTime);
                    const existingEnd = existingStart + (parseInt(b.duration) * 60);

                    const newStart = timeToMinutes(bookingData.startTime);
                    const newEnd = newStart + (parseInt(bookingData.duration) * 60);

                    return newStart < existingEnd && newEnd > existingStart;
                });

                // If conflict exists, reject booking
                if (conflict) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: false,
                        message: "This time slot is already booked"
                    }));
                }

                // Save booking
                bookings.push(bookingData);

                // Write updated bookings to file
                fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));

                // Send success response
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    booking: bookingData
                }));

            } catch (error) {
                console.error(error);
                res.writeHead(500);
                res.end("Server Error");
            }
        });
    }

    // ===== SERVE FRONTEND FILES =====
    // Serves static files like HTML, CSS, JS, JSON
    else {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // Resolve file path from request
        let filePath = path.join(
            __dirname,
            'public',
            pathname === '/' ? 'index.html' : pathname
        );

        const ext = path.extname(filePath);

        // Determine content type based on file extension
        let contentType = 'text/html';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.json') contentType = 'application/json';

        // Read and serve the file
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end("Not Found");
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    }
});

// Start the server and listen on the defined port
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});