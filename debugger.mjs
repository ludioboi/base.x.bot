import {exec} from "child_process";
import dateformat from "dateformat";

class Debugger {
    static bot = undefined
    constructor(bot) {
        this.bot = bot
        this.messageHandler = this.messageHandler.bind(this)
        bot.on("messageCreate", this.messageHandler)
    }

    messageHandler(message){
        let bot = this.bot

        let fetchUser = async (id) => {
            return await bot.users.fetch(id)
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