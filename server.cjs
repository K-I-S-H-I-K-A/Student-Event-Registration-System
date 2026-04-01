const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Path to users.json
const usersFile = path.join(__dirname, 'public', 'data', 'users.json');

const server = http.createServer((req, res) => {

    // ===== REGISTER API =====
    if (req.method === 'POST' && req.url === '/register') {
        let body = '';

        req.on('data', chunk => body += chunk);

        req.on('end', () => {
            try {
                const newUser = JSON.parse(body);

                let users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

                const exists = users.find(u => u.email === newUser.email);

                res.writeHead(200, { 'Content-Type': 'application/json' });

                if (exists) {
                    return res.end(JSON.stringify({
                        success: false,
                        message: "User already exists"
                    }));
                }

                // Generate next ID
                let nextId = 1;

                if (users.length > 0) {
                    nextId = Math.max(...users.map(u => u.id || 0)) + 1;
                }

                // Assign ID to new user
                newUser.id = nextId;

                users.push(newUser);

                fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

                res.end(JSON.stringify({ success: true }));

            } catch (error) {
                res.writeHead(500);
                res.end("Server Error");
            }
        });
    }

    // ===== LOGIN API =====
    else if (req.method === 'POST' && req.url === '/login') {
        let body = '';

        req.on('data', chunk => body += chunk);

        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);

                let users = [];

                try {
                    const data = fs.readFileSync(usersFile, 'utf-8');
                    users = data ? JSON.parse(data) : [];
                } catch {
                    users = [];
                }

                const user = users.find(
                    u => u.email === email && u.password === password
                );

                res.writeHead(200, { 'Content-Type': 'application/json' });

                if (user) {
                    res.end(JSON.stringify({
                        success: true,
                        role: user.role,
                        id: user.id
                    }));
                } else {
                    res.end(JSON.stringify({ success: false }));
                }

            } catch (error) {
                res.writeHead(500);
                res.end("Server Error");
            }
        });
    }

    // ===== GET BOOKINGS FOR USER =====
    else if (req.method === 'GET' && req.url.startsWith('/api/bookings')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId'));

    const bookingsFile = path.join(__dirname, 'data', 'bookings.json');
    const propertiesFile = path.join(__dirname, 'data', 'properties.json');

    try {
        const bookingsData = fs.readFileSync(bookingsFile, 'utf-8');
        const bookings = bookingsData ? JSON.parse(bookingsData) : [];

        const propertiesData = fs.readFileSync(propertiesFile, 'utf-8');
        const properties = propertiesData ? JSON.parse(propertiesData) : [];

        // Filter user bookings
        const userBookings = bookings.filter(b => Number(b.userId) === userId);

        // Merge with property details
        const enrichedBookings = userBookings.map(b => {
            const property = properties.find(p => p.id === b.propertyId);

            return {
                ...b,
                workspace: property?.workspace || "Unknown Workspace",
                address: property?.address || "No address",
                price: property?.price || 0,
                owner: property?.owner || "Unknown",
                status: "upcoming" // you can improve this later
            };
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enrichedBookings));

    } catch (error) {
        console.error(error);
        res.writeHead(500);
        res.end("Server Error");
    }
}

    // ===== GET ALL PROPERTIES =====
    else if (req.method === 'GET' && req.url === '/api/properties') {
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
    else if (req.method === 'POST' && req.url === '/book') {
        let body = '';

        req.on('data', chunk => body += chunk);

        req.on('end', () => {
            try {
                const bookingData = JSON.parse(body);

                const bookingsFile = path.join(__dirname, 'data', 'bookings.json');

                let bookings = [];

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
                function timeToMinutes(time) {
                    const [h, m] = time.split(":").map(Number);
                    return h * 60 + m;
                }

                const conflict = bookings.find(b => {
                    if (Number(b.propertyId) !== Number(bookingData.propertyId)) return false;
                    if (b.date !== bookingData.date) return false;

                    const existingStart = timeToMinutes(b.startTime);
                    const existingEnd = existingStart + (parseInt(b.duration) * 60);

                    const newStart = timeToMinutes(bookingData.startTime);
                    const newEnd = newStart + (parseInt(bookingData.duration) * 60);

                    return newStart < existingEnd && newEnd > existingStart;
                });

                if (conflict) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: false,
                        message: "This time slot is already booked"
                    }));
                }

                // ===== SAVE BOOKING =====
                bookings.push(bookingData);

                fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));

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
    else {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        let filePath = path.join(
            __dirname,
            'public',
            pathname === '/' ? 'index.html' : pathname
        );

        const ext = path.extname(filePath);

        let contentType = 'text/html';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.json') contentType = 'application/json';

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

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});