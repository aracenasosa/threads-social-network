import app from "./app";

import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on("error", (error) => {
    console.error("Server error:", error);
});