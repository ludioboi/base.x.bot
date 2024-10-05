import {exec} from "child_process"
import fs from "fs"
import dateformat from "dateformat"

function log(data, proc=undefined) {
    if (proc === undefined) {
        proc = process
    }
    let logString = dateformat(new Date(), "dd.mm.yyyy - hh:MM:ss:l") + " [" + proc.pid + "]: " + data
    console.log(logString)
    fs.appendFile("./logs.txt", logString + "\n", (err) => {
        if (err) {
            console.error(err)
        }
    })
}

function clearUpdateLogs() {
    fs.writeFileSync("./updateLogs.txt", "")
}

function clearLogs() {
    fs.writeFileSync("./logs.txt", "")
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
            startBot("./updateLogs.txt")
        })
    })
}

function startBot(file = undefined){
    let botProc = exec("node index.mjs " + process.argv[2] + (file === undefined ? "" : " " + file))
    botProc.stdout.on("data", (data) => {
        log(data, botProc)
    })
    botProc.stderr.on("data", (data) => {
        log("Error: " + data, botProc)
    })
    botProc.on("exit", (code) => {
        if (code === 0) {
            log("Bot instance has been exited successfully")
        } else if (code === 233) {
            log("Bot has been stopped and trying to update")
            updateBot()
        }
    })
}

clearLogs()
log("Main Process started")
startBot()