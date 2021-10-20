const database = { "smruck@gmail.com": "cheetah" };

const CryptoJS = require("crypto-js");
const ipsKeys = {};
const optionsClients = { cors: { origin: "http://localhost", methods: ["GET", "POST"] } } //client connection options (cert pem required in production)
const optionsServers = { cors: { origin: "http://localhost", methods: ["GET", "POST"] } } //server options allow server ip only

const express = require("express");
const app = express();

const serverClients = app.listen(3456, "localhost");
const serverServers = app.listen(3457, "localhost");

var socketIoClients = require("socket.io")(optionsClients).listen(serverClients);
var socketIoServers = require("socket.io")(optionsServers).listen(serverServers);

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
    else return;
});

socketIoServers.on("connect", async function(client) {

    // ip filter to pass only server (in development client and server ips are ::1)
    if (!(client.handshake.address === "::1" || client.handshake.address === "127.0.0.1")) return; 

    await receiveClientInfo(client.handshake.query);
});

console.clear();
console.log("socket.io servers are listening...")

async function receiveClientInfo(query) {

    const keys = require("./privatekeys"); // predefined encryption key for trafic between both servers(can be changed periodically) 
    const clip = CryptoJS.AES.decrypt(query.clip, keys.cryptoServerKey).toString(CryptoJS.enc.Utf8);
    const clientIp = clip === "::1" ? "127.0.0.1" : clip;
    const clientKey = CryptoJS.AES.decrypt(query.temp, keys.cryptoServerKey).toString(CryptoJS.enc.Utf8);

    ipsKeys[clientIp] = { clientKey: clientKey, time: Date.now() };
}

async function authClient(query, ip) {

    const startIdx = ipsKeys[ip].clientKey.match(/\d/);
    const key = ipsKeys[ip].clientKey.substring(startIdx, 11);
    const email = CryptoJS.AES.decrypt(query.sc7be6bdf90f453b99f1db8f6526518c, key).toString(CryptoJS.enc.Utf8);;
    const password = CryptoJS.AES.decrypt(query.d2c64414315b4598a5e5fe5832761101, key).toString(CryptoJS.enc.Utf8);

    if (database[email] === password) return true;

    return false;
}