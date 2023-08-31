const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Discord = require("discord.js");
const { t } = require("i18next"); // i18next
module.exports = {
  name: "resume",
  usage: "/resume",
  category: "Bot",
  description: "Resume Music.",
  run: async (client, interaction) => {
    await interaction.deferReply().catch((err) => {});
    const queue = client.distube.getQueue(interaction);
    if (!queue)
      return interaction
        .followUp(
          `${t("error.nosonglist", { ns: "common", lng: interaction.locale })}`
        )
        .catch((err) => {});
    if (queue.paused === false)
      return interaction
        .followUp(
          `${t("error.musicalreadyplaying", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .catch((err) => {});
    interaction
      .followUp({
        content: `${t("succes.musicresummed", {
          ns: "common",
          lng: interaction.locale,
        })}`,
      })
      .catch((err) => {});
    queue.resume();
  },
};
