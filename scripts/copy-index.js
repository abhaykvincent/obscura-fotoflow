const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "build", "index.html");
const destination = path.join(root, "functions", "index.html");

fs.copyFileSync(source, destination);
