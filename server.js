const express = require('express');
const app = express();
const path = require('path');


app.set('trust proxy', true); 

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const WEBHOOK_URL = 'https://discord.com/api/webhooks/1521127035030864024/OKXG67lszXDCuRSU4IhM9Yj3jYiijb8-5TCKfVgknaeffyINyJ6ZnZNUGn_i2gDT2cH2';


async function sendDiscordLog(title, description, color) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('여기에_디스코드')) {
        console.log('⚠️ 디스코드 웹훅 URL이 설정되지 않아 로그를 전송하지 않습니다.');
        return;
    }

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: title,
                    description: description,
                    color: color, 
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (err) {
        console.error('❌ 디스코드 웹훅 전송 실패:', err);
    }
}

const users = [];
const ipCounts = {};


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
            `**닉네임:** ${nickname}\n**접속 IP:** \`${userIP}\`\n*한 IP에서 2번 이상 가입을 시도하여 차단되었습니다.*`,
            15158332
        );
        return res.status(400).json({ message: "IP 생성 제한 초과" });
    }

    users.push({ nickname, password, ip: userIP });
    ipCounts[userIP] = currentIpCount + 1;


    await sendDiscordLog(
        '🟢 새 회원 등록 완료',
        `**닉네임:** ${nickname}\n**접속 IP:** \`${userIP}\`\n*대시보드에 성공적으로 가입했습니다.*`,
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
            `**입력한 닉네임:** ${nickname}\n**접속 IP:** \`${userIP}\`\n*비밀번호 불일치 혹은 없는 계정입니다.*`,
            15105570
        );
        return res.status(400).json({ message: "정보 불일치" });
    }


    await sendDiscordLog(
        '🔓 유저 로그인 성공',
        `**닉네임:** ${user.nickname}\n**접속 IP:** \`${userIP}\`\n*대시보드 인증에 성공했습니다.*`,
        3447003
    );

    return res.status(200).json({ message: "로그인 성공", nickname: user.nickname });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
