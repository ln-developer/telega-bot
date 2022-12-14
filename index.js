const TelegaBotApi = require('node-telegram-bot-api');
const { QUIZ_OPTIONS } = require('./core/options');
const GamerModel = require('./core/models');
const { JOIN_NO } = require("./variables");
const express = require('express');
const sequelize = require('./db');
const https = require('https');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const {
    WELCOME_MSG,
    JOIN_QUIZ,
    THANKS_FI_MSG,
    IS_EXISTS_MSG,
    RELEASE_MSG,
    REJECTED_MSG,
    ERROR_MSG
} = require("./core/messages");
const {
    BOT_TOKEN,
    MSG_EVENT,
    START_COMMAND,
    HELLO_STICKER,
    QUIZ_CALLBACK,
    SAD_STICKER,
    GOOD_JOB_STICKER
} = require("./core/common");

//Timeout Time
const TIMER_24_H = (24 * 60 * 1000);

//GLOBAL SCOPE
let isStarted = false;

//Create Bot
const Bot = new TelegaBotApi(BOT_TOKEN, { polling: true });

//init server
const app = express();

app.use(express.json());
app.use(cors());

const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
}, app);

const PORT = 8000;
app.listen(PORT, () => {
    console.log('Server started on PORT: ', PORT);
})

app.post('/web-data', async (request, response) => {
    const { queryId, gamer, wishes } = request.body;

    console.log('Logger: ', queryId, gamer, wishes)

    try {
        await Bot.answerWebAppQuery(queryId, {
           type: 'article',
            id: queryId,
            title: 'Успешная регистрация участника',
            input_message_content: {
               message_text: 'Поздравляю! Ты успешно добавлен в базу данных участников'
            }
        });
        await addNewUser(queryId, gamer, wishes);
        return response.status(200).json({});
    } catch (err) {
        await Bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Ошибка регистрации участника',
            input_message_content: {
                message_text: 'Что-то пошло не так! К сожалению, ты не был добавлен в базу данных участников'
            }
        });
        return response.status(500).json({});
    }
})

//Functions
startTimer = async () => {
    setTimeout(async () => {
        const allGamersArr = await GamerModel.findAll({ raw: true });

        const newArr = [ ...shuffleUsers(allGamersArr) ];
        const arrLength = newArr.length;

        newArr.forEach((gamer, idx) => {
            if (idx === arrLength - 1) {
                const msg = `Привет! Выбрал для тебя участника ☺️\n${ newArr[0].name }`;

                Bot.sendMessage(gamer.chatId, msg);

                if (newArr[0].hobby) {
                    const hintMsg = `P.S. небольшая подсказка для тебя 😉\n${ newArr[0].hobby }`;

                    Bot.sendMessage(gamer.chatId, hintMsg);
                }
            } else {
                const msg = `Привет! Выбрал для тебя участника ☺️\n${ newArr[idx + 1].name }`;

                Bot.sendMessage(gamer.chatId, msg);

                if (newArr[idx + 1].hobby) {
                    const hintMsg = `P.S. небольшая подсказка для тебя 😉\n${ newArr[idx + 1].hobby }`;

                    Bot.sendMessage(gamer.chatId, hintMsg);
                }
            }
        })
    }, 120000)
}

startBot = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
    } catch (error) {
        console.error(error);
        console.log('ERROR: ', 'База отвалилась, печально');
    }

    Bot.on(MSG_EVENT, async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            // Как только юзер присоединился к чату
            if (text === START_COMMAND) {
                await Bot.sendMessage(chatId, WELCOME_MSG);
                await Bot.sendSticker(chatId, HELLO_STICKER);
                return Bot.sendMessage(chatId, JOIN_QUIZ, QUIZ_OPTIONS);
            }

            // если пользовал ввел какую-то дичь
            else {
                return Bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз 😅');
            }
        } catch (error) {
            console.log(error);
            return Bot.sendMessage(chatId, ERROR_MSG)
        }
    })

    Bot.on(QUIZ_CALLBACK, async (answer) => {
        const userAnswer = answer.data;
        const chatId = answer.message.chat.id;

        // ответ НЕТ на присоединение
        if (userAnswer === JOIN_NO) {
            await Bot.sendSticker(chatId, SAD_STICKER);
            return Bot.sendMessage(chatId, REJECTED_MSG);
        }

    })
}

shuffleUsers = (usersArr) => {
    let currentIndex = usersArr.length,  randomIndex;

    while (currentIndex !== 0) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [usersArr[currentIndex], usersArr[randomIndex]] = [usersArr[randomIndex], usersArr[currentIndex]];
    }

    return usersArr;
}

isExistsFn = async (id) => {
    let isExists = false;
    const allGamersArr = await GamerModel.findAll({ raw: true });
    allGamersArr.forEach(gamer => {
        if (gamer.chatId === id) {
            isExists = true;
        }
    })

    return isExists;
}

addNewUser = async (chatId, name, hobby) => {
    isExistsFn(chatId).then(async (result) => {
        if (!result) {
            const gamer = {
                name,
                hobby,
                chatId
            }
            // кидаем игрока в БД
            await GamerModel.create(gamer);

            // запуск таймера, только когда присоединится первый игрок
            if (!isStarted) {
                await startTimer();
                isStarted = true;
            }

            await Bot.sendMessage(chatId, THANKS_FI_MSG);
            await Bot.sendSticker(chatId, GOOD_JOB_STICKER);
            return Bot.sendMessage(chatId, RELEASE_MSG);
        } else {
            return Bot.sendMessage(chatId, IS_EXISTS_MSG);
        }
    })
}

//START BOT
startBot().then(r => {
    console.log("The game's starting!");
});
