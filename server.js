const express = require("express");
const path = require("path");

const app = express();

app.disable("etag");

app.use(
  express.static(path.join(__dirname, "public"), {
    etag: false,
    lastModified: false,
    maxAge: "1h",
    immutable: true,
  }),
);

app.get("/", (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function startServer(port = process.env.PORT || 3000) {
  return app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
