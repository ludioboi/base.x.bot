import {exec} from "child_process";
import dateformat from "dateformat";
import Helper from "./Helper.mjs";

class Debugger {
    static bot = undefined
    static helper = undefined
    logFile = undefined
    constructor(bot, logFile) {
        this.bot = bot
        this.logFile = logFile
        this.messageHandler = this.messageHandler.bind(this)
        this.helper = new Helper(bot)
        bot.on("messageCreate", this.messageHandler)
    }

    messageHandler(message){
        let bot = this.bot

        let fetchUser = async (id) => {
            return await bot.users.fetch(id)
        }
        let fetchChannel = async (id) => {
            return await bot.channels.fetch(id)
        }
        try {
            this.helper.onMessageCreate(message)
        } catch (err) {
            message.reply("Error: ```javascript\n" + err + "\n```")
        }

        if (message.channel.type !== 1) {
            return
        }
        if (message.author.id !== "406744318712348672") {
            return
        }
        if (message.content === "test") {

        }
        if (message.content.startsWith("eval")) {
            let code = message.content.split(" ").slice(1).join(" ")
            try {
                let result = eval("async () => { return " +  code + "}")()
                if (result instanceof Promise) {
                    result.then((res) => {
                        if (res instanceof Object) {
                            res = JSON.stringify(res, null, 2)
                        }
                        message.channel.send("```javascript\n" + res + "\n```")
                    }).catch((err) => {
                        message.channel.send("```javascript\n" + err + "\n```")
                    })
                } else {
                    if (result instanceof Object) {
                        result = JSON.stringify(result, null, 2)
                    }
                    message.channel.send("```javascript\n" + result + "\n```")
                }
            } catch (err) {
                message.channel.send("```javascript\n" + err + "\n```")
            }
        }
        if (message.content.startsWith("chn")) {
            let channelID = message.content.split(" ").slice(1).join(" ")
            if (this.helper.switchChannel(channelID)) {
                message.reply("Switched channel <#" + channelID + "> ON")
            } else {
                message.reply("Switched channel <#" + channelID + "> OFF")
            }
        }
        if (message.content === "update") {
            message.reply("Updating bot...").then((msg) => {
                process.exit(233)
            })
        }
        if (message.content === "stop") {
            message.reply("Stopping bot").then((msg) => {
                process.exit(0)
            })
        }

        if (message.content === "log") {
            try {
                message.channel.send({content: this.logFile, files: [this.logFile]})
            } catch (err) {
                message.channel.send("```javascript\n" + err + "\n```")
            }
        }

        if (message.content.startsWith("execd")) {
            let code = message.content.split(" ").slice(1).join(" ")
            let proc = undefined
            let log = (data) => {
                let logString = dateformat(new Date(), "dd.mm.yyyy - hh:MM:ss:l") + " [" + proc.pid + "]: " + data
                message.channel.send("```bash\n" + logString + "\n```")
            }
            try {
                let execProc = exec(code, {detached: true})
                proc = execProc
                execProc.stdout.on("data", (data) => {
                    log(data)
                })
                execProc.stderr.on("data", (data) => {
                    log("ERROR\n" + data)
                })
                execProc.on("exit", (code) => {
                    log("Process exited with code " + code)
                })
            } catch (err) {
                log("ERROR\n" + err)
            }
            return
        }

        if (message.content.startsWith("exec")) {
            let code = message.content.split(" ").slice(1).join(" ")
            let proc = undefined
            let log = (data) => {
                let logString = dateformat(new Date(), "dd.mm.yyyy - hh:MM:ss:l") + " [" + proc.pid + "]: " + data
                message.channel.send("```bash\n" + logString + "\n```")
            }
            try {
                let execProc = exec(code)
                proc = execProc
                execProc.stdout.on("data", (data) => {
                    log(data)
                })
                execProc.stderr.on("data", (data) => {
                    log("ERROR\n" + data)
                })
                execProc.on("exit", (code) => {
                    log("Process exited with code " + code)
                })
            } catch (err) {
                log("ERROR\n" + err)
            }
        }
    }
}
export default Debugger;