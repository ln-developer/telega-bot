const { JOIN_YES, JOIN_NO, HINT_YES, HINT_NO } = require("./variables");
const { QUIZ_OPTIONS, QUIZ_HINT_OPTIONS } = require('./options');
const TelegaBotApi = require('node-telegram-bot-api');
const GamerModel = require('./models');
const sequelize = require('./db');
const {
    WELCOME_MSG,
    JOIN_QUIZ,
    THANKS_FI_MSG,
    IS_EXISTS_MSG,
    RELEASE_MSG,
    JOINED_MSG,
    INFO_MSG,
    REJECTED_MSG,
    HINT_YES_MSG,
    ERROR_MSG
} = require("./messages");
const {
    BOT_TOKEN,
    MSG_EVENT,
    START_COMMAND,
    HELLO_STICKER,
    QUIZ_CALLBACK,
    GOOD_STICKER,
    SAD_STICKER,
    GOOD_JOB_STICKER
} = require("./core");

//Timeout Time
const TIMER_24_H = (24 * 60 * 1000);

//GLOBAL SCOPE
let isStarted = false;
const FI_TAG = '#имя';
const HINT_TAG = '#подсказка';

//Create Bot
const Bot = new TelegaBotApi(BOT_TOKEN, { polling: true });

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
    }, 90000)
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

            // если юзер заполнил имя
            else if (text?.includes(FI_TAG)) {
                isExistsFn(chatId).then(async (result) => {
                    if (!result) {
                        const gamer = {
                            name: msg.text,
                            chatId
                        }
                        // кидаем игрока в БД
                        await GamerModel.create(gamer);

                        // логируем все
                        chatLogger(msg);

                        // запуск таймера, только когда присоединится первый игрок
                        if (!isStarted) {
                            await startTimer();
                            isStarted = true;
                        }

                        return Bot.sendMessage(chatId, THANKS_FI_MSG, QUIZ_HINT_OPTIONS);
                    } else {
                        return Bot.sendMessage(chatId, IS_EXISTS_MSG);
                    }
                })
            }

            // если юзер заполнил подсказку
            else if (text?.includes(HINT_TAG)) {
                // достаем игрока из БД
                const gamer = await GamerModel.findOne({ chatId });
                gamer.hobby = msg.text;
                await gamer.save();

                await Bot.sendSticker(chatId, GOOD_JOB_STICKER);
                return Bot.sendMessage(chatId, RELEASE_MSG);
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

        // ответ ДА на присоединение
        if (userAnswer === JOIN_YES) {
            await Bot.sendSticker(chatId, GOOD_STICKER);
            await Bot.sendMessage(chatId, JOINED_MSG);
            return Bot.sendMessage(chatId, INFO_MSG);
        }

        // ответ НЕТ на присоединение
        else if (userAnswer === JOIN_NO) {
            await Bot.sendSticker(chatId, SAD_STICKER);
            return Bot.sendMessage(chatId, REJECTED_MSG);
        }

        // ответ ДА на подсказку
        else if (userAnswer === HINT_YES) {
            return Bot.sendMessage(chatId, HINT_YES_MSG);
        }

        // ответ НЕТ на подсказку
        else if (userAnswer === HINT_NO) {
            await Bot.sendSticker(chatId, GOOD_JOB_STICKER);
            return Bot.sendMessage(chatId, RELEASE_MSG);
        }

    })
}

chatLogger = (msg) => {
    console.log('-------------- New Gamer --------------');
    console.log('======================================');
    console.log('CHAT ID: ', msg.chat.id);
    console.log('USER NAME: ', msg.chat.first_name);
    console.log('TEXT: ', msg.text);
    console.log('======================================');
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

//START BOT
startBot().then(r => {
    console.log("The game's starting!");
});
