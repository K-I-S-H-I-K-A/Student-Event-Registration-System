import express from 'express'; 
import path from 'path'; 
import { fileURLToPath } from 'url'; 

import authRoutes from './routes/authRoutes.js'; 
import propertyRoutes from "./routes/propertyRoutes.js";

const app = express(); 
const PORT = 3000; 

// Fix __dirname for ES modules 
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 

// Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(authRoutes);
app.use("/auth", authRoutes);

// Property routes
app.use("/properties", propertyRoutes);

// Serve frontend 
app.use(express.static(path.join(__dirname, 'public')));

// Start server 
app.listen(PORT, () => { 
    console.log(`Server running at http://localhost:${PORT}`);
});