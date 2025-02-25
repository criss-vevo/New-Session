const { malvinid } = require('./id'); 
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { Storage } = require("megajs");

const {
    default: Criss_Vevo,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Function to generate a random Mega ID
function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

// Function to upload credentials to Mega
async function uploadCredsToMega(credsPath) {
    try {
        const storage = await new Storage({
            email: 'nexusxd.bot@gmail.com', // Your Mega A/c Email Here
            password: 'malvin266' // Your Mega A/c Password Here
        }).ready;
        console.log('Mega storage initialized.');

        if (!fs.existsSync(credsPath)) {
            throw new Error(`File not found: ${credsPath}`);
        }

        const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: `${randomMegaId()}.json`,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;

        console.log('Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log(`Session Url: ${megaUrl}`);
        return megaUrl;
    } catch (error) {
        console.error('Error uploading to Mega:', error);
        throw error;
    }
}

// Function to remove a file
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Router to handle pairing code generation
router.get('/', async (req, res) => {
    const id = malvinid(); 
    let num = req.query.number;

    async function CRISS_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            let Criss = Criss_Vevo({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari")
            });

            if (!Criss.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Criss.requestPairingCode(num);
                console.log(`Your Code: ${code}`);

                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Criss.ev.on('creds.update', saveCreds);
            Criss.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000);
                    const filePath = __dirname + `/temp/${id}/creds.json`;

                    if (!fs.existsSync(filePath)) {
                        console.error("File not found:", filePath);
                        return;
                    }

                    const megaUrl = await uploadCredsToMega(filePath);
                    const sid = megaUrl.includes("https://mega.nz/file/")
                        ? '𝐂𝐑𝐈𝐒𝐒-𝐌𝐃~' + megaUrl.split("https://mega.nz/file/")[1]
                        : 'Error: Invalid URL';

                    console.log(`Session ID: ${sid}`);

                    const session = await Criss.sendMessage(Criss.user.id, { text: sid });

                    const CRISS_TEXT = `
╔═══════════════════
 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐂𝐑𝐈𝐒𝐒 𝐌𝐃 
 ✅ 𝐘𝐨𝐮𝐫 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐈𝐝 𝐈𝐬 𝐑𝐞𝐚𝐝𝐲
╚═══════════════════

╔═══════════════════
𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐋𝐈𝐍𝐊 𝐇𝐄𝐑𝐄
https://whatsapp.com/channel/0029Vb0HIV2G3R3s2II4181g
╚═══════════════════

╔═══════════════════
☉︎𝐖𝐏-𝐌𝐄-𝐎𝐖𝐍𝐄𝐑®️
https://wa.me/message/NY5RNQQH2DYTN1
╚═══════════════════

╔═══════════════════
 𝐓𝐡𝐚𝐧𝐤𝐬 𝐟𝐨𝐫 𝐂𝐡𝐨𝐨𝐬𝐢𝐧𝐠 𝐂𝐫𝐢𝐬𝐬 𝐌𝐝
╚═══════════════════`;

                    await Criss.sendMessage(Criss.user.id, { text: CRISS_TEXT }, { quoted: session });

                    await delay(100);
                    await Criss.ws.close();
                    return removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    CRISS_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Has Been Restarted:", err);
            removeFile('./temp/' + id);

            if (!res.headersSent) {
                res.send({ code: "Service is Currently Unavailable" });
            }
        }
    }

    await CRISS_PAIR_CODE();
});

module.exports = router;
