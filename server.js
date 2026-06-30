const express = require('express');
const app = express();
const path = require('path');

app.set('trust proxy', true); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1521127035030864024/OKXG67lszXDCuRSU4IhM9Yj3jYiijb8-5TCKfVgknaeffyINyJ6ZnZNUGn_i2gDT2cH2';
const users = [];
const ipCounts = {};

async function blockVPN(req, res, next) {
    const userIP = req.ip;
    if (userIP === '::1' || userIP === '127.0.0.1') {
        return next();
    }
    try {
        const vpnCheck = await fetch(`https://blackbox.ipinfo.app/lookup/${userIP}`);
        const result = await vpnCheck.text();
        if (result.trim() === 'Y') {
            console.log(`[🚫 VPN 차단] IP: ${userIP}`);
            return res.status(403).send('<h1>403 Forbidden</h1><p>VPN 또는 프록시 환경에서는 접속할 수 없습니다.</p>');
        }
    } catch (err) {
        console.error(err);
    }
    next();
}

app.use(blockVPN);

async function sendDiscordLog(title, description, color) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('내_디스코드')) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{ title, description, color, timestamp: new Date().toISOString() }]
            })
        });
    } catch (err) {
        console.error(err);
    }
}

app.post('/api/register', async (req, res) => {
    const { nickname, password } = req.body;
    const userIP = req.ip; 

    if (!nickname || !password) {
        return res.status(400).json({ message: "데이터 입력 오류" });
    }

    const existsUser = users.find(u => u.nickname === nickname);
    if (existsUser) {
        return res.status(400).json({ message: "중복된 닉네임" });
    }

    const currentIpCount = ipCounts[userIP] || 0;
    if (currentIpCount >= 2) {
        await sendDiscordLog(
            '⚠️ 가입 시도 차단 (IP 제한 초과)',
            `**닉네임:** ${nickname}\n**접속 IP:** \`${userIP}\``,
            15158332
        );
        return res.status(400).json({ message: "IP 생성 제한 초과" });
    }

    users.push({ nickname, password, ip: userIP });
    ipCounts[userIP] = currentIpCount + 1;

    await sendDiscordLog(
        '🟢 새 회원 등록 완료',
        `**닉네임:** ${nickname}\n**접속 IP:** \`${userIP}\``,
        3066993
    );

    return res.status(200).json({ message: "회원가입 완료" });
});

app.post('/api/login', async (req, res) => {
    const { nickname, password } = req.body;
    const userIP = req.ip;

    const user = users.find(u => u.nickname === nickname && u.password === password);
    if (!user) {
        await sendDiscordLog(
            '❌ 로그인 실패 경고',
            `**입력한 닉네임:** ${nickname}\n**접속 IP:** \`${userIP}\``,
            15105570
        );
        return res.status(400).json({ message: "정보 불일치" });
    }

    await sendDiscordLog(
        '🔓 유저 로그인 성공',
        `**닉네임:** ${user.nickname}\n**접속 IP:** \`${userIP}\``,
        3447003
    );

    return res.status(200).json({ message: "로그인 성공", nickname: user.nickname });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
