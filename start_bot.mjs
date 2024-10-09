import {exec} from "child_process"
import fs from "fs"
import dateformat from "dateformat"

if (fs.existsSync("./logs/") === false) {
    fs.mkdirSync("./logs/")
}

const logFile = "./logs/" + dateformat(new Date(), "dd_mm_yyyy-hh_MM_ss") + "_logs.txt"

function log(data, proc=undefined) {
    if (proc === undefined) {
        proc = process
    }
    let logString = dateformat(new Date(), "dd.mm.yyyy - hh:MM:ss:l") + " [" + proc.pid + "]: " + data
    console.log(logString)
    fs.appendFile(logFile, logString + "\n", (err) => {
        if (err) {
            console.error(err)
        }
    })
}

function clearUpdateLogs() {
    fs.writeFileSync("./updateLogs.txt", "")
}

function clearLogs() {
    fs.writeFileSync(logFile, "")
    clearUpdateLogs()
}

function writeUpdateLog(data) {
    fs.appendFile("./updateLogs.txt", data + "\n", (err) => {
        if (err) {
            console.error(err)
        }
    })
}

function updateBot(){
    clearUpdateLogs()
    let git = exec("git pull")
    git.stdout.on("data", (data) => {
        log(data, git)
        writeUpdateLog(data)
    })
    git.on("exit", (code) => {
        let npm = exec("npm install")
        npm.stdout.on("data", (data) => {
            log(data, npm)
            writeUpdateLog(data)
        })
        npm.on("exit", (code) => {
            log("Update finished, attempting to start bot")
            startBot(logFile, "./updateLogs.txt")
        })
    })
}

let restartAttempts = 0
let maxRestartAttempts = 5
let restartTimeout = 1000 * 60 * 10
let timeoutID = undefined

function startBot(logFile, updateFile=undefined){
    let botProc = exec("node index.mjs " + process.argv[2] + " " + logFile + (updateFile === undefined ? "" : " " + updateFile))
    botProc.stdout.on("data", (data) => {
        log(data, botProc)
    })
    botProc.stderr.on("data", (data) => {
        log("Error: " + data, botProc)
    })
    botProc.on("error", (err) => {
        log("Error: " + err)
    })
    botProc.on("exit", (code) => {
        if (code === 0) {
            log("Bot instance has been exited successfully")
        } else if (code === 233) {
            log("Bot has been stopped and trying to update")
            updateBot()
        } else {
            if (restartAttempts >= maxRestartAttempts) {
                log("Bot has been stopped with unknown exit code: " + code + ". Maximum restart attempts reached, stopping bot")
                if (timeoutID !== undefined) {
                    clearTimeout(timeoutID)
                }
                let git = exec("git add ./logs/" + logFile)
                git.on("message", (data) => {
                    console.log(data)
                })
                git.on("error", (err) => {
                    console.error(err)
                })
                git.on("close", (code) => {
                    console.log(code)
                })
                git.on("exit", (code) => {
                    console.log("git add complete")
                    git = exec("git commit -m \"Log file " + logFile + " has been added\"")
                    git.on("message", (data) => {
                        console.log(data)
                    })
                    git.on("exit", (code) => {
                        console.log("git commit complete")
                        git = exec("git push")
                        git.on("message", (data) => {
                            console.log(data)
                        })
                        git.on("exit", (code) => {
                            console.log("git push complete")
                            process.exit(0)
                        })
                    })
                })
                return
            }
            restartAttempts++
            if (timeoutID !== undefined) {
                clearTimeout(timeoutID)
            }
            setTimeout(() => {
                timeoutID = undefined
                restartAttempts = 0
            }, restartTimeout)
            log("Bot has been stopped with unknown exit code: " + code + ". Trying to restart bot... Attempt " + restartAttempts)
            startBot(logFile, updateFile)
        }

    })
}

clearLogs()
log("Main Process started")
startBot(logFile)