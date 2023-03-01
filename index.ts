import express from "express";
import path from "path";
import fs from "fs";

const PORT = 9000;

const app = express();

app.use(express.static(path.join(__dirname, "js")));
app.use(express.static(path.join(__dirname, "css")));

app.get("/", (_, res) => {
    res.sendFile(__dirname + "/pages/initial.html");
});

app.get("/success", (_, res) => {
    res.sendFile(__dirname + "/pages/success.html");
});

app.post("/notification", (_, res) => {
    const writeStream = fs.createWriteStream(__dirname + "/success");
    writeStream.close();
    res.status(200).send();
});

app.get("/status", (_, res) => {
    if (fs.existsSync(__dirname + "/success")) {
        res.status(200).json({ status: "SUCCESS" });
        fs.unlink(__dirname + "/success", (err) => {
            if (err) {
                console.error("There was an error while deleting the success file: ", err);
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`The application is listening on port ${PORT}`);
});
