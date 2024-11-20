# Persisted To-Do List

A user-friendly, persistent to-do list application built with Node.js, Express, PostgreSQL, and EJS. The app allows users to register, log in, and manage their tasks, with user-specific lists stored in a database.

---

## Features
- **User Authentication:** Register and log in to maintain personalized task lists.
- **Task Management:** Add, edit, and delete tasks.
- **Persistent Data:** User tasks are stored in a PostgreSQL database for reliability.
- **Session Handling:** Sessions are implemented to ensure secure and seamless user experiences.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<username>/<repository>.git
   cd Persisted-To-Do-List

2. Install dependencies:
   ```bash
   npm install

3. Set up your PostgreSQL database:
- Create a database named permalist.
- Create the following tables:
  ```bash
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  );

  CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE
  );

4. Update database credentials in index.js:
   ```bash
   const db = new pg.Client({
   user: "postgres",
   host: "localhost",
   database: "permalist",
   password: "<your_password>",
   port: 5432,
   });

5. Start the server:
   ```bash
   node index.js

6. Visit the app: Open your browser and go to http://localhost:3000.

## Usage
### Registration and Login
Visit /register to create a new account.
Log in at /login to manage your tasks.

### Task Management
Add new tasks.
Edit existing tasks.
Delete completed tasks.

### Logout
Use the "Log Out" button to securely end your session.

## Technologies Used
**Backend:** Node.js, Express.js
**Frontend:** EJS
**Database:** PostgreSQL
**Authentication:** bcrypt for password hashing, express-session for session management

## License
This project is open-source and available under the MIT License.

## Contributing
Contributions are welcome! Feel free to fork the repository and submit pull requests.
```bash
Save this as `README.md` in your project directory!

