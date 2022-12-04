const { JOIN_YES, JOIN_NO, HINT_YES, HINT_NO } = require("./variables");
const { QUIZ_OPTIONS, QUIZ_HINT_OPTIONS } = require('./options');
const TelegaBotApi = require('node-telegram-bot-api');
const {
    WELCOME_MSG,
    JOIN_QUIZ,
    THANKS_FI_MSG,
    IS_EXISTS_MSG,
    RELEASE_MSG,
    JOINED_MSG,
    INFO_MSG,
    REJECTED_MSG,
    HINT_YES_MSG
} = require("./messages");
const {
    BOT_TOKEN,
    MSG_EVENT,
    START_COMMAND,
    HELLO_STICKER,
    QUIZ_CALLBACK,
    GOOD_STICKER,
    SAD_STICKER, GOOD_JOB_STICKER
} = require("./core");

//Timeout Time
const TIMER_24_H = (24 * 60 * 1000);

//GLOBAL SCOPE
let gamersArr = [
    // {
    //     name: '#имя Егорка', id: 1262480811,
    // },
    {
        name: '#имя Эмиль', id: 521994769,
    }
];
let isStarted = false;
const FI_TAG = '#имя';
const HINT_TAG = '#подсказка';

//Create Bot
const Bot = new TelegaBotApi(BOT_TOKEN, { polling: true });

//Functions
startTimer = async () => {
    setTimeout(() => {
        const newArr = [...shuffleUsers(gamersArr)];

        const arrLength = newArr.length;

        newArr.forEach((gamer, idx) => {
            if (idx === arrLength - 1) {
                const msg = `
                Привет! Выбрал для тебя участника ☺️

                ${ newArr[0].name }
                `;

                Bot.sendMessage(gamer.id, msg);

                if (newArr[0].hobby) {
                    const hintMsg = `
                    P.S. небольшая подсказка для тебя 😉
                    ${ newArr[0].hobby }
                    `;

                    Bot.sendMessage(gamer.id, hintMsg);
                }
            } else {
                const msg = `
                Привет! Выбрал для тебя участника ☺️

                ${ newArr[idx + 1].name }
                `;

                Bot.sendMessage(gamer.id, msg);

                if (newArr[idx + 1].hobby) {
                    const hintMsg = `
                    P.S. небольшая подсказка для тебя 😉
                    ${ newArr[idx + 1].hobby }
                    `;

                    Bot.sendMessage(gamer.id, hintMsg);
                }
            }
        })
    }, 60000)
}

startBot = () => {
    Bot.on(MSG_EVENT, async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        // Как только юзер присоединился к чату
        if (text === START_COMMAND) {
            await Bot.sendMessage(chatId, WELCOME_MSG);
            await Bot.sendSticker(chatId, HELLO_STICKER);
            return Bot.sendMessage(chatId, JOIN_QUIZ, QUIZ_OPTIONS);
        }

        // если юзер заполнил имя
        if (text?.includes(FI_TAG)) {
            if (!isExists(chatId)) {
                const gamer = {
                    name: msg.text,
                    id: chatId
                }
                gamersArr.push(gamer);
                chatLogger(msg);
                console.log(gamersArr)
                // gamersArrLogger(gamersArr);

                // запуск таймера, только когда присоединится первый игрок
                if (!isStarted) {
                    await startTimer();
                    isStarted = true;
                }

                return Bot.sendMessage(chatId, THANKS_FI_MSG, QUIZ_HINT_OPTIONS);
            } else {
                return Bot.sendMessage(chatId, IS_EXISTS_MSG);
            }
        }

        // если юзер заполнил подсказку
        if (text?.includes(HINT_TAG)) {
            const userIdx = getUserIdx(chatId);
            gamersArr[userIdx].hobby = msg.text;
            console.log(gamersArr)
            await Bot.sendSticker(chatId, GOOD_JOB_STICKER);
            return Bot.sendMessage(chatId, RELEASE_MSG);
        }

        return Bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз 😅');
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

getUserIdx = (chatId) => {
    let index;
    gamersArr.forEach((gamer, idx) => {
        if (gamer.id === chatId) {
            index = idx;
        }
    })
    return index;
}

isExists = (id) => {
    let isExists = false;
    gamersArr.forEach(gamer => {
        if (gamer.id === id) {
            isExists = true;
        }
    })

    return isExists;
}

//START BOT
startBot();
