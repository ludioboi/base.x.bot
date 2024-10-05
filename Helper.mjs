import {
    EmbedBuilder
} from "discord.js";

class Helper {
    channelIDs = []
    bot = undefined
    constructor(bot) {
        this.bot = bot
        this.onMessageCreate = this.onMessageCreate.bind(this)
        this.addChannel = this.addChannel.bind(this)
        this.removeChannel = this.removeChannel.bind(this)
        this.switchChannel = this.switchChannel.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
    }

    sendMessage(message, user) {
        //user.send("Message sent in channel: <#" + message.channel.id + "> by user <@" + message.author.id + "> (" + message.author.username + ")")
        if (message.content !== undefined && message.content !== "") {
            let embed = new EmbedBuilder()
                .setAuthor({name: message.author.tag, iconURL: message.author.avatarURL()})
                .setDescription(message.content)
                .setTitle("Message sent in channel: <#" + message.channel.id + ">")
                .setTimestamp(message.createdTimestamp)
            user.send({embeds: [embed]})
        }
        if (message.embeds !== undefined && message.embeds.length > 0) {
            user.send({content: "Message sent in channel: <#" + message.channel.id + "> by user <@" + message.author.id + "> (" + message.author.username + ")", embeds: [message.embeds[0]]})
        }
    }

    onMessageCreate(message) {
        if (message.channel.type !== 0) {
            return
        }
        if (this.channelIDs.includes(message.channel.id)) {
            this.bot.users.fetch("406744318712348672").then((user) => {
                this.sendMessage(message, user)
            })
        }
    }

    switchChannel(channelID) {
        if (this.channelIDs.includes(channelID)) {
            this.removeChannel(channelID)
            return false
        } else {
            this.addChannel(channelID)
            this.bot.channels.fetch(channelID).then((channel) => {
                channel.messages.fetch({limit: 10}).then((messages) => {
                    this.bot.users.fetch("406744318712348672").then((user) => {
                        messages.forEach((message) => {
                            this.sendMessage(message, user)
                        })
                    })
                })
            })
            return true
        }
    }

    addChannel(channelID) {
        this.channelIDs.push(channelID)
    }
    removeChannel(channelID) {
        this.channelIDs = this.channelIDs.filter((c) => c !== channelID)
    }
}

export default Helper