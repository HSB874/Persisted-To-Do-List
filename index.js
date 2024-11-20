import express from "express";
import bodyParser from "body-parser";
import pg from "pg"; // Step 1
import bcrypt from "bcrypt";
import session from "express-session";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "abc123",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "abc123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,   // Make cookie inaccessible to JavaScript for security
      secure: false,    // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);
app.use((req, res, next) => {
  res.locals.session = req.session; // Make session available globally
  next();
});


//Homepage
app.get("/", async (req, res) => {
  console.log("In the / route handler");
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: result.rows,
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).send("Internal Server Error");
  }
});

//Add Items
app.post("/add", async (req, res) => {
  const item = req.body.newItem;

  // Check if the input is empty or contains only whitespace
  if (!item || item.trim() === "") {
    console.log("Attempted to add an empty item.");
    return res.redirect("/"); // Redirect without adding anything
  }

  try {
    await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
    res.redirect("/");
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).send("Internal Server Error");
  }
});

//Edit Items
app.post("/edit", async (req, res) => {
  const { updatedItemId, updatedItemTitle } = req.body;

  if (!updatedItemId || updatedItemTitle.trim() === "") {
    return res.redirect("/"); // Prevent updating with invalid data
  }

  try {
    await db.query("UPDATE items SET title = $1 WHERE id = $2", [
      updatedItemTitle,
      updatedItemId,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).send("Internal Server Error");
  }
});

//Delete Items
app.post("/delete", async (req, res) => {
  const { deleteItemId } = req.body;

  if (!deleteItemId) {
    return res.redirect("/"); // Prevent invalid delete requests
  }

  try {
    await db.query("DELETE FROM items WHERE id = $1", [deleteItemId]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).send("Internal Server Error");
  }
});

//Registration Page
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

//Register New User
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.send("Username and password are required.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const result = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword] //new user is inserted into the database
    );
    console.log("New user ID:", result.rows[0].id);
    res.redirect("/login");
  } catch (err) {
    if (err.code === "23505") {
      // Handle unique constraint error
      res.send("Username already exists. Please choose another.");
    } else {
      console.error(err);
      res.send("Error creating user.");
    }
  }
});

//Login page
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

//Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res.send("User not found. Please register first.");
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (isValidPassword) {
      req.session.userId = user.id; // Store user ID in session after successful login
      console.log("User logged in. Session User ID:", req.session.userId);
      res.redirect("/");
    } else {
      res.send("Invalid username or password.");
    }
  } catch (err) {
    console.error(err);
    res.send("Error logging in.");
  }
});

//Check Session
app.get("/check-session", (req, res) => {
  res.send(`Session User ID: ${req.session.userId || "No User Logged In"}`);
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.send("Error logging out.");
    }
    console.log("User logged out. Session User ID: N/A");
    // Clear the session cookie (connect.sid)
    res.clearCookie("connect.sid", { path: "/" });
    res.redirect("/login"); // Redirect to login after logout
  });
});

//Authenicated User function
function isAuthenticated(req, res, next) {
  console.log("Session User ID:", req.session.userId); // Log session ID to debug
  if (req.session.userId) {
    return next(); // User is authenticated, proceed
  }
  res.redirect("/login"); // Redirect to login page if not authenticated
}

//Restrict / route to authenicated users
app.get("/", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM items WHERE user_id = $1",
      [req.session.userId]
    );
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.send("Error fetching tasks.");
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
