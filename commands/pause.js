const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Discord = require("discord.js");
const { t } = require("i18next"); // i18next
module.exports = {
  name: "pause",
  usage: "/pause",
  category: "Bot",
  description: "Pause Music.",
  run: async (client, interaction) => {
    await interaction.deferReply().catch((err) => {});
    const queue = client.distube.getQueue(interaction);
    if (!queue)
      return interaction
        .followUp(
          `${t("error.nosonglist", { ns: "common", lng: interaction.locale })}`
        )
        .catch((err) => {});
    if (queue.paused === true)
      return interaction
        .followUp(
          `${t("error.musicalreadystoped", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .catch((err) => {});

    interaction
      .followUp({
        content: `${t("succes.musicpaused", {
          ns: "common",
          lng: interaction.locale,
        })}`,
      })
      .catch((err) => {});
    client.distube.pause(interaction);
  },
};
