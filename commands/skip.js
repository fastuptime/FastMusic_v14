const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
} = require("discord.js");
const Discord = require("discord.js");
const { t } = require("i18next"); // i18next
const config = require("../config.js");
module.exports = {
  name: "skip",
  usage: "/skip",
  category: "Bot",
  description: "Skip Commands",
  run: async (client, interaction) => {
    await interaction.deferReply().catch((err) => {});
    const queue = client.distube.getQueue(interaction);
    if (!queue)
      return interaction
        .followUp(
          `${t("error.nosonglist", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .catch((err) => {});
    if (queue.songs.length === 1)
      return interaction
        .followUp(
          `${t("error.nosongqueue", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .catch((err) => {});

    await client.distube.skip(interaction)

    const part = Math.floor((queue.currentTime / queue.songs[0].duration) * 20);
    async function message() {
      const embed = new EmbedBuilder()
        .setTitle(
          `${t("succes.songskipsucces", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .setDescription(`**[${queue.songs[0].name}](${queue.songs[0].url})**`)
        .addFields(
          {
            name: `${t("music.author", {
              ns: "common",
              lng: interaction.locale,
            })}:`,
            value: `[${queue.songs[0].uploader.name}](${queue.songs[0].uploader.url})`,
            inline: true,
          },
          {
            name: `${t("music.time", {
              ns: "common",
              lng: interaction.locale,
            })}:`,
            value: ` **[${queue.songs[0].formattedDuration}]**`,
            inline: false,
          }
        )
        .setImage(
          `${
            queue.songs[0].thumbnail ||
            "https://www.technopat.net/sosyal/data/avatars/o/472/472796.jpg?1648288120"
          }`
        )

        .setColor(config.embed.success)
        .setFooter({
          text: `${config.footer.text}`,
          iconURL: `${config.footer.icon}`,
        });
      const roww = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setEmoji("🔊")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("volumes"),
          new ButtonBuilder()
          .setEmoji("🌀")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("loops")
      );
      return interaction
        .followUp({ embeds: [embed], components: [roww] })
        .catch((err) => {});
    }
    await setTimeout(message, 1000);
  },
};
