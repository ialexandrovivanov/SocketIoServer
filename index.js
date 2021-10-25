const database = { "smruck@gmail.com": "qqqqqq" };

const CryptoJS = require("crypto-js");
const ipsKeys = {};
const optionsClients = { cors: { origin: "http://localhost", methods: ["GET", "POST"] } } //client connection options (cert pem for production)
const optionsServers = { cors: { origin: "http://localhost", methods: ["GET", "POST"] } } //server options allow server ip only

const express = require("express");
const app = express();

const serverClients = app.listen(3456, "localhost");
const serverServers = app.listen(3457, "localhost");

const socketIoClients = require("socket.io")(optionsClients).listen(serverClients);
const socketIoServers = require("socket.io")(optionsServers).listen(serverServers);

socketIoClients.on("connect", async function(client) {

    const ip = client.handshake.address;
    const query = client.handshake.query;
    
    const success = await authClient(query, ip);

    if(success) {
        client.on("122377668230417aae686a77bb52da98", (data) => {
            client.join(data.room);
        });
    
        client.on("cc0462fcafd24bc9b6e527607ad9a3b2", (data) => {
            socketIoClients.to(data.room).emit("cc0462fcafd24bc9b6e527607ad9a3b2", data);
        });
    }
    else 
        return;
});

socketIoServers.on("connect", async function(clientServer) {

    // additional filter to pass only client server ip
    if (!(clientServer.handshake.address === "::1" || clientServer.handshake.address === "127.0.0.1")) 
        return; 

    await receiveClientInfo(clientServer.handshake.query);
});

console.clear();
console.log("socket.io servers are listening...")

async function receiveClientInfo(query) {

    const keys = require("./privatekeys"); // predefined encryption key for trafic between servers(can be changed periodically) 
    const clip = CryptoJS.AES.decrypt(query.clip, keys.cryptoServerKey).toString(CryptoJS.enc.Utf8); // client ip
    const clientIp = clip === "::1" ? "127.0.0.1" : clip;   // in db records must be in format "127.0.0.1"
    const clientKey = CryptoJS.AES.decrypt(query.temp, keys.cryptoServerKey).toString(CryptoJS.enc.Utf8); // key for client decryption

    ipsKeys[clientIp] = { clientKey: clientKey, time: Date.now() };  // record for each client ip 
}

async function authClient(query, ip) {

    try {
        const startIdx = ipsKeys[ip].clientKey.match(/\d/);
        const key = ipsKeys[ip].clientKey.substring(startIdx, 11);
        const email = CryptoJS.AES.decrypt(query.sc7be6bdf90f453b99f1db8f6526518c, key).toString(CryptoJS.enc.Utf8);;
        const password = CryptoJS.AES.decrypt(query.d2c64414315b4598a5e5fe5832761101, key).toString(CryptoJS.enc.Utf8);

        if (database[email] === password) return true;

        return false;

    } catch (err) { console.log(err); return false; }
    
}