const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/contracts", require("./routes/contractRoutes"));
app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);
app.use(
  "/api",
  require("./routes/ejarRoutes")
);

app.use(
  "/api/najiz",
  require("./routes/najizRoutes")
);

app.use(
  "/api/finance",
  require("./routes/financeRoutes")
);

app.use(
  "/api/ejar",
  require("./routes/ejarRoutes")
);

// app.js OR server.js

const legalRoutes =
  require("./routes/legalRoutes");

/*
  REGISTER ROUTE
*/

app.use(
  "/api",
  legalRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
