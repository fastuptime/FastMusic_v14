const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Discord = require("discord.js");
const { t } = require("i18next"); // i18next
const music_mongo = require("../models/music.js"); // Music Model
module.exports = {
  name: "stop",
  usage: "/stop",
  category: "Bot",
  description: "Stop Music.",
  run: async (client, interaction) => {
    await interaction.deferReply().catch((err) => {});
    const queue = client.distube.getQueue(interaction);
    if (!queue)
      return interaction
        .followUp(
          `${t("error.nosonglist", { ns: "common", lng: interaction.locale })}`
        )
        .catch((err) => {});
    interaction
      .followUp({
        content: `${t("succes.musicstopped", {
          ns: "common",
          lng: interaction.locale,
        })}`,
      })
      .catch((err) => {});
    client.distube.stop(interaction)

    const data = await music_mongo.findOne({ guildId: interaction.guild.id });
    if (!data) return;
    await music_mongo
      .deleteOne({ guildId: interaction.guild.id })
      .catch((err) => {
        console.log(err);
      });
  },
};
