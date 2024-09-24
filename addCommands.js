const { REST, Routes } = require("discord.js")
const fs = require("fs")

const filePath = './config.json';
let config = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const commands = [
    {
        name: "set_channel",
        description: "Setze den Channel, welcher für die Spieler Suche genutzt werden soll."
    }
]
console.log(config.token)
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(config.client_id, config.guild_id),
            { body: commands },
        );
    } catch (error) {
        console.error(error)
    }
})();