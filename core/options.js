const { JOIN_NO, JOIN_YES, HINT_NO, HINT_YES } = require("../variables");
const {WEB_APP_URL} = require("./common");

module.exports = {
    QUIZ_OPTIONS: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: 'Нет',
                        callback_data: JOIN_NO
                    },
                    {
                        text: 'Да',
                        web_app: { url: WEB_APP_URL }
                    },
                ],
            ]
        })
    },
    QUIZ_HINT_OPTIONS: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: 'Нет',
                        callback_data: HINT_NO
                    },
                    {
                        text: 'Да',
                        callback_data: HINT_YES
                    },
                ],
            ]
        })
    }
}
