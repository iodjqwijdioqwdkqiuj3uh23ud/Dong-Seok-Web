const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = [];
const ipCounts = {};

app.post('/api/register', (req, res) => {
    const { nickname, password } = req.body;
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!nickname || !password) {
        return res.status(400).json({ message: "데이터 입력 오류" });
    }

    const existsUser = users.find(u => u.nickname === nickname);
    if (existsUser) {
        return res.status(400).json({ message: "중복된 닉네임" });
    }

    const currentIpCount = ipCounts[userIP] || 0;
    if (currentIpCount >= 2) {
        return res.status(400).json({ message: "IP 생성 제한 초과" });
    }

    users.push({ nickname, password, ip: userIP });
    ipCounts[userIP] = currentIpCount + 1;

    return res.status(200).json({ message: "회원가입 완료" });
});

app.post('/api/login', (req, res) => {
    const { nickname, password } = req.body;
    const user = users.find(u => u.nickname === nickname && u.password === password);
    if (!user) {
        return res.status(400).json({ message: "정보 불일치" });
    }
    return res.status(200).json({ message: "로그인 성공", nickname: user.nickname });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
