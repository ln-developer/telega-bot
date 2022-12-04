const { JOIN_NO, JOIN_YES, HINT_NO, HINT_YES } = require("./variables");

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
                        callback_data: JOIN_YES
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
