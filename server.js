try {
  const express = require("express");
  const next = require("next");
  require("dotenv").config({ path: "/env" });
  const dev = process.env.NODE_ENV !== "production";
  const app = next({ dev });
  const routes = require("./routes");
  const bodyParser = require("body-parser");
  const handle = routes.getRequestHandler(app);
  app
    .prepare()

    .then(() => {
      const server = express();
      server.use(bodyParser.json({ limit: "50mb" }));
      server.use(function (req, res, next) {
        res.setHeader(
          "Access-Control-Allow-Methods",
          "POST, PUT, OPTIONS, DELETE, GET"
        );
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header("Access-Control-Allow-Credentials", true);
        next();
      });
      server.use("./server/health", (req, res, next) => {
        res.send({ success: true, message: "Server is running.." });
      });
      server.get("*", (req, res) => {
        return handle(req, res);
      });
      const PORT = process.env.PORT || 3000;

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${PORT}`);
});
    })
    .catch((ex) => {
      console.log(ex.message);
      process.exit(1);
    });
} catch (err) {
  console.log(err);
}
