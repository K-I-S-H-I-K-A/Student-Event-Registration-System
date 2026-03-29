const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Path to users.json
const usersFile = path.join(__dirname, 'data', 'users.json');

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
                        role: user.role
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

    // ===== SERVE FRONTEND FILES =====
    else {
        let filePath = path.join(
            __dirname,
            'public',
            req.url === '/' ? 'index.html' : req.url
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