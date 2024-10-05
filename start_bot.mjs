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

clearLogs()
log("Main Process started")