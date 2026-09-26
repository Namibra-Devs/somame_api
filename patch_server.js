const fs = require('fs');
const file = 'C:/xampp/htdocs/somame_api/server.js';
let content = fs.readFileSync(file, 'utf8');

const t1 = "// Global Middlewares";
const r1 = "// Global Middlewares\napp.use((req, res, next) => {\n  req.io = io;\n  next();\n});";

if (!content.includes('req.io = io')) {
    content = content.replace(t1, r1);
    fs.writeFileSync(file, content);
    console.log('server.js patched');
}
