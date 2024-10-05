import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    VoiceChannel,
    Events,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle, SlashCommandBuilder,
    ChannelType,
    Partials
} from 'discord.js';

import fs from 'fs';
import Debugger from './debugger.mjs';

const filePath = './config.json';
let config
let lastMessage = null;
readConfig()

function saveConfig() {
    fs.writeFileSync(filePath, JSON.stringify(config), 'utf8');
}

function readConfig() {
    config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.DirectMessages ], partials: [Partials.Channel, Partials.Message, Partials.User] });

let activeChannels = [];

function errorHandling(fn) {
    try {
        fn()
    } catch (err) {
        bot.users.fetch("406744318712348672").then((user) => {
            user.send("Error occurred \n```javascript\n" + err + "\n```")
        })
        console.error(err)
    }
}

function isPlayerSearchAvailable(interaction){
    let member = interaction.member
    if (member.voice === null) {
        return {message: "Du befindest dich in keinem VoiceChannel!"};
    }
    if (member.voice.channel === null) {
        return {message: "Du befindest dich in keinem VoiceChannel!"};
    }
    if (!config.categories.includes(member.voice.channel.parentId)) {
        return {message: "Du befindest dich in keine gültigem VoiceChannel!"};
    }
    let voiceChannel = member.voice.channel

    let foundVoiceChannel = activeChannels.find((acChannel) => {
        return acChannel["voiceChannelID"] === voiceChannel.id;
    })
    if (voiceChannel.userLimit === 0) {
        return {message: "Dein Channel hat keinen User Limit!"};
    }
    if (voiceChannel.userLimit === voiceChannel.members.size) {
        return {message: "Dein Channel ist bereits voll!"};
    }
    if (foundVoiceChannel) {
        return {message: "Dein Channel ist bereits gelistet!"};
    }
    return true;
}

function createLFPEmbed(voiceChannel) {
    let playersNeeded = voiceChannel.userLimit - voiceChannel.members.size;
    let percentage = Math.round((voiceChannel.members.size / voiceChannel.userLimit) * 100);
    let color = 0x07f547;
    if (percentage >= 25) {
        color = 0x21ad05;
    }
    if (percentage >= 50) {
        color = 0xf5f507;
    }
    if (percentage >= 75) {
        color = 0xe05a07;
    }
    if (percentage >= 90) {
        color = 0xe00707;
    }
    let embed = new EmbedBuilder()
        .setTitle('Neue Spieler Suche!')
        .setColor(color)
        .setDescription('<#' + voiceChannel.id + '> sucht noch ' + playersNeeded + ' Spieler\n(Drücke auf die Verlinkung um dem Channel beizutreten)')
        .setTimestamp()
    let fields = [];
    let counter = 0;
    for (const [id, member] of voiceChannel.members) {
        fields.push({name: 'Spieler ' + (++counter), value: "<@" + id + ">"});
    }
    for (let i = 0; i < playersNeeded; i++) {
        fields.push({name: 'Spieler ' + (i + 1 + voiceChannel.members.size), value: "Gesucht..."});
    }
    embed.addFields(fields);

    return {content: "<@&1191502134009671741>", embeds: [embed.toJSON()]};
}

bot.on(Events.InteractionCreate, async (interaction) => {
    errorHandling(async () => {
        if (interaction.isChatInputCommand()) {
            console.log("Chat Input Command \"" + interaction.commandName + "\" executed by " + interaction.user.tag);
            if (interaction.commandName === "setchannel") {
                let channel = interaction.channel;
                config["channel_id"] = channel.id;
                saveConfig()
                readConfig()
                interaction.reply({content: "Channel gesetzt!", ephemeral: true})
                setupTextChannel()
            }
            if (interaction.commandName === "addwh") {
                let category = interaction.options.getChannel("category").id;
                config.categories.push(category)
                saveConfig()
                readConfig()
                interaction.reply({content: "Category hinzugefügt!", ephemeral: true})
            }
            if (interaction.commandName === "logs") {
                let logsFile = "./logs.txt";
                let logs = fs.readFileSync(logsFile, 'utf8');
                interaction.reply({content: "Logs\n```javascript\n" + logs + "\n```", ephemeral: true});
            }
        }
        if (interaction.isButton()) {
            if (interaction.customId === "lfp") {
                console.log("Button \"lfp\" clicked by " + interaction.user.tag);
                let member = interaction.member;
                let voiceChannel = member.voice.channel;
                let playerSearchAvailable = isPlayerSearchAvailable(interaction);
                if (playerSearchAvailable !== true) {
                    interaction.reply({content: playerSearchAvailable["message"], ephemeral: true});
                    return;
                }
                let embed = createLFPEmbed(voiceChannel);
                let message = await interaction.channel.send(embed);
                activeChannels.push({voiceChannelID: voiceChannel.id, messageID: message.id});
                interaction.reply({content: "Dein Channel wurde erfolgreich gelistet!", ephemeral: true});
                sendButtonMessage()
            }
        }
    })
})

function sendButtonMessage(){
    errorHandling(()=> {
        if (lastMessage !== null) {
            bot.channels.fetch(config["channel_id"]).then((channel) => {
                channel.messages.fetch(lastMessage).then((message) => {
                    message.delete();
                })
            })
        }
        bot.channels.fetch(config["channel_id"]).then((channel) => {
            const lfpButton = new ButtonBuilder()
                .setCustomId('lfp')
                .setLabel('Starte Spielersuche')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(lfpButton);
            channel.send({content: "Klicke auf den Button um eine LFP Nachricht zu erstellen!", components: [row]}).then((message) => {
                lastMessage = message.id;
            });
        })
    })

}

function setupTextChannel() {
    if (config["channel_id"] === undefined) {
        return
    }
    errorHandling(() => {
        bot.channels.fetch(config["channel_id"]).then((channel) => {
            channel.bulkDelete(100).then(() => {
                sendButtonMessage()
            })
        })
    })
}

function checkVoiceStates(state){
    let voiceChannel = state.channel;
    if (voiceChannel === null) {
        return
    }
    let foundVoiceChannel = activeChannels.find((acChannel) => {
        return acChannel["voiceChannelID"] === voiceChannel.id;
    })
    if (foundVoiceChannel) {
        if (voiceChannel.members.size === 0 || voiceChannel.userLimit === voiceChannel.members.size) {
            let index = activeChannels.indexOf(foundVoiceChannel);
            activeChannels.splice(index, 1);
            let message = bot.channels.cache.get(config["channel_id"]).messages.cache.get(foundVoiceChannel["messageID"]);
            message.delete();
            return;
        }
        let embed = createLFPEmbed(voiceChannel);
        let message = bot.channels.cache.get(config["channel_id"]).messages.cache.get(foundVoiceChannel["messageID"]);
        message.edit(embed);
    }
}

bot.on("voiceStateUpdate", (oldState, newState) => {
    errorHandling(() => {
        checkVoiceStates(newState);
        checkVoiceStates(oldState);
    })
})

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    setupTextChannel()
    if (process.argv.length === 4) {
        let file = process.argv[3];
        bot.users.fetch("406744318712348672").then((user) => {
            fs.readFile(file, (err, data) => {
                if (err) {
                    user.send("Error reading file: " + err);
                    return;
                }
                user.send("Update Logs\n```javascript\n" + data + "\n```");
            })
        })
    }
});

let deb = new Debugger(bot);
bot.login(process.argv[2]).then(() => {
    const setChannelCommand = {
        name: "setchannel",
        description: "Setzt den Channel für die LFP Nachrichten"
    }
    const addCategoryCommand = new SlashCommandBuilder()
        .setName("addwh")
        .setDescription("Fügt eine Kategorie zur Whitelist hinzu")
        .addChannelOption(option => option.setName("category").setDescription("Die Category").setRequired(true).addChannelTypes(ChannelType.GuildCategory)).toJSON()

    const logsCommand = new SlashCommandBuilder()
        .setName("logs")
        .setDescription("Gebe dir die letzen Logs seit dem Start des Main Threads aus")


    errorHandling(()=> {
        bot.guilds.fetch(config["guild_id"]).then((guild) => {
            guild.commands.create(setChannelCommand).then((command) => {
            })
            guild.commands.create(addCategoryCommand).then((command) => {
            })
            guild.commands.create(logsCommand).then((command) => {
            })
        })
    })
})