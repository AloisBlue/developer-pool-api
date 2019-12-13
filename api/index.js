// imports
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import mongoose from "mongoose";

// local imports
import users from "./routes/users";
import questions from "./routes/questions";
import databaseKeys from "../config/keys";

const app = express();

// manage middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded ({ extended: false }));

const database = databaseKeys.keys.DB_URL;
mongoose
  .connect(database, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => console.log(`Connected to ${database}`))
  .catch(err => console.log(err))

// register endpoints
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
});

app.use("/api/users", users);
app.use("/api/questions", questions);

const port = process.env.PORT || 5000;

const server = app.listen(port, () => console.log(`Server running on port ${port}`));

export default server;
