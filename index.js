const express = require("express")
const { createServer } = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");
const fs = require("fs")

const app = express();
const server = createServer(app);
const io = new Server(server);

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
 
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({savedlinks:[]})
  .write()

app.use(express.static("src"))

app.get("/", (req, res) => {
    res.sendFile(__dirname+"/index.html")
})

app.get("/wordlist", (req, res) => {
    res.send(wordlist)
})

app.get("/w/:word", (req, res) => {
    if(db.get('savedlinks').find({
            wordlink:req.params.word
        }).value()){
        res.redirect(db.get('savedlinks').find({
            wordlink:req.params.word
        }).value().url)
    }else{
        res.sendFile(__dirname+"/notfound.html")
    }
})

io.on('connection', (socket) => {
    console.log("wlink has been connected to a new user.")
    socket.on("linknum", (longurl) => {
        const newHash = crypto.createHash("SHA256").update(longurl.replaceAll(" ", "")).digest('hex');
        const num1 = (Number("0x"+newHash.toString().slice(0,3)))/2;
        const num2 = (Number("0x"+newHash.toString().slice(3,6)))/2;
        if(!db.get('savedlinks').find({url:longurl}).value()){
            socket.emit("shortenedurl", fs.readFileSync("bip.txt").toString().split("\r\n")[parseInt(num1)], fs.readFileSync("bip.txt").toString().split("\r\n")[parseInt(num2)])
            db.get("savedlinks").push({
                wordlink:fs.readFileSync("bip.txt").toString().split("\r\n")[parseInt(num1)]+" "+fs.readFileSync("bip.txt").toString().split("\r\n")[parseInt(num2)],
                url:longurl
            }).write();
        }else{
            socket.emit("urltaken", fs.readFileSync("bip.txt").toString().split("\r\n")[parseInt(num1)], fs.readFileSync("bip.txt").toString().split("\r\n")[parseInt(num2)])
        }
    })
})

server.listen(17273, () => {
    console.log("wlink is listening on http://localhost:17273")
});