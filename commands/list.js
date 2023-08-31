const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Discord = require("discord.js");
const { t } = require("i18next"); // i18next
const config = require("../config.js"); // config
module.exports = {
  name: "list",
  usage: "/list",
  category: "Bot",
  description: "List Commands",
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
    const list = new EmbedBuilder()
      .setTitle("Current queue")
      .setDescription(
        queue.songs
          .map(
            (song, id) =>
              `**${id + 1}**. [${song.name}](${song.url}) - \`${
                song.formattedDuration
              }\``
          )
          .join("\n")
      )
      .setColor(config.embed.success)
      .setFooter({
        text: `${config.footer.text}`,
        iconURL: `${config.footer.icon}`,
      });
    interaction.editReply({ embeds: [list] }).catch((err) => {});
  },
};
