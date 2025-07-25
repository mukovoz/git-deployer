import {AbstractStep} from "./AbstractStep.js";
import TelegramBot from 'node-telegram-bot-api';
import {AbstractNotificationStep} from "./AbstractNotificationStep.js";


export class Telegram extends AbstractNotificationStep {

    run = () => {
        const bot = new TelegramBot(this.step?.bot_id, {polling: false});
        (async () => {
            try {
               await bot.sendMessage(this.step?.chat_id, this.getMessage(),{parse_mode: 'HTML'});
            } catch (error) {
                console.error('Error while sending message to telegram:', error);
            }
        })();
    }
}