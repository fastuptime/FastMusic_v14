const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js")
const config = require("../config.js");
module.exports = {
    name: "nowplaying",
    usage: "/nowplaying",
    category: "Bot",
    description: "Shows the currently playing song.",
    run: async (client, interaction) => {
      await interaction.deferReply().catch(err => {})
        const queue = client.distube.getQueue(interaction);
        if (!queue)
        return interaction
          .followUp(
            `${t("error.nosonglist", { ns: "common", lng: interaction.locale })}`
          )
          .catch((err) => {});
          const part = Math.floor((queue.currentTime / queue.songs[0].duration) * 20);
          const embed = new EmbedBuilder()
              .setColor('Purple')
              .setDescription(`**[${queue.songs[0].name}](${queue.songs[0].url})**`)
              .addFields(
                { name: 'Music Author:', value: `[${queue.songs[0].uploader.name}](${queue.songs[0].uploader.url})`, inline: true },
                { name: 'Voice:', value: `${queue.volume}%`, inline: true },
                { name: 'Views:', value: `${queue.songs[0].views}`, inline: true },
                { name: 'Like:', value: `${queue.songs[0].likes}`, inline: true },
                { name: 'Filtre:', value: `${queue.filters.names.join(', ') || "Standart"}`                    , inline: true },
                { name: `Video Time:`, value: `**[${queue.formattedCurrentTime} / ${queue.songs[0].formattedDuration}]**`, inline: false })
                .setThumbnail(queue.songs[0].thumbnail)
                .setColor(config.embed.success)
                .setFooter({
                  text: `${config.footer.text}`,
                  iconURL: `${config.footer.icon}`,
                });
return interaction.followUp({embeds: [embed]}).catch(err => {})

          }
 }