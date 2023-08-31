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
const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const { t } = require("i18next"); // i18next
const music_mongo = require("../models/music.js");
const config = require("../config.js");
const music = require("../models/music.js");
module.exports = {
  name: "play",
  usage: "/play <name>",
  category: "Bot",
  description: "Music Player.",
  options: [
    {
      name: `music_name`,
      description: "Song name",
      type: 3,
      required: true,
    },
  ],
  run: async (client, interaction, track) => {
    await interaction.deferReply().catch(async (err) => {
      const error = new EmbedBuilder()
        .setTitle(
          `${t("error.musicerrortitle", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .setDescription(
          `${t("error.musicerrordescription", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .setColor(config.embed.error)
        .setFooter({
          text: `${config.footer.text}`,
          iconURL: `${config.footer.icon}`,
        });
      await interaction.followUp({ embeds: [error] }).catch((err) => {});
    });
    const voice = interaction.options.getString("music_name");
    let voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
      return interaction.followUp({
        content: `${t("error.notvoicechannel", {
          ns: "common",
          lng: interaction.locale,
        })}`,
      });
    const queue = client.distube.getQueue(interaction);

    client.distube.voices.join(voiceChannel).catch(async (err) => {
      client.distube.voices.leave(voiceChannel);
      const error = new EmbedBuilder()
        .setTitle(
          `${t("error.musicerrortitle", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .setDescription(
          `${t("error.musicerrordescription", {
            ns: "common",
            lng: interaction.locale,
          })}`
        )
        .setColor(config.embed.error)
        .setFooter({
          text: `${config.footer.text}`,
          iconURL: `${config.footer.icon}`,
        });
      await interaction.followUp({ embeds: [error] }).catch((err) => {});
    });

    await client.distube
      .play(interaction.member.voice.channel, voice)
      .then(async () => {
        const tracks = await client.player
          .search(voice, {
            requestedBy: interaction.user,
          })
          .then((x) => x.tracks[0])
          .catch(async (err) => {
            const error = new EmbedBuilder()
              .setTitle(
                `${t("error.musicerrortitle", {
                  ns: "common",
                  lng: interaction.locale,
                })}`
              )
              .setDescription(
                `${t("error.musicerrordescription", {
                  ns: "common",
                  lng: interaction.locale,
                })}`
              )
              .setColor(config.embed.error)
              .setFooter({
                text: `${config.footer.text}`,
                iconURL: `${config.footer.icon}`,
              });
            await interaction.followUp({ embeds: [error] }).catch((err) => {});
          });
        if (!tracks)
          return interaction
            .followUp(
              `${t("succes.tracksplayed", {
                ns: "common",
                lng: interaction.locale,
              })}`
            )
            .catch((err) => {});
        const views = tracks.views;
        function formatNumber(views) {
          if (views >= 1000000000) {
            return (views / 1000000000).toFixed(1) + "B";
          } else if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + "M";
          } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + "K";
          }
          return views;
        }
        const embed = new EmbedBuilder()
          .addFields(
            {
              name: `${t("music.title", {
                ns: "common",
                lng: interaction.locale,
              })}`,
              value: `${tracks.title}`,
              inline: true,
            },
            {
              name: `${t("music.author", {
                ns: "common",
                lng: interaction.locale,
              })}`,
              value: `${tracks.author}`,
              inline: true,
            },
            {
              name: `${t("music.time", {
                ns: "common",
                lng: interaction.locale,
              })}`,
              value: `${tracks.duration}`,
              inline: true,
            },
            {
              name: `${t("music.views", {
                ns: "common",
                lng: interaction.locale,
              })}`,
              value: `${formatNumber(views)}`,
              inline: true,
            },
            {
              name: `${t("music.video", {
                ns: "common",
                lng: interaction.locale,
              })}`,
              value: "[Click](" + tracks.url + ")",
              inline: true,
            }
          )
          .setColor(config.embed.success)
          .setImage(
            `${
              tracks.thumbnail ||
              "https://www.technopat.net/sosyal/data/avatars/o/472/472796.jpg?1648288120"
            }`
          )
          .setFooter({
            text: `${config.footer.text}`,
            iconURL: `${config.footer.icon}`,
          });
        const rowm = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setEmoji("🔊")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("volume"),
          new ButtonBuilder()
            .setEmoji("🌀")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("loop")
        );
        await interaction
          .followUp({ embeds: [embed], components: [rowm] })
          .then(async (messages) => {
            await new music_mongo({
              guildId: interaction.guild.id,
              channelId: interaction.channel.id,
              interactionId: messages.id,
              music: voice,
              userId: interaction.user.id,
              title: tracks.title,
              uploader: tracks.author,
              time: tracks.duration,
              views: tracks.views,
              thumbnail: tracks.thumbnail,
              video: tracks.url,
            }).save();
          })
          .catch(async (err) => {
            const error = new EmbedBuilder()
              .setTitle(
                `${t("error.musicerrortitle", {
                  ns: "common",
                  lng: interaction.locale,
                })}`
              )
              .setDescription(
                `${t("error.musicerrordescription", {
                  ns: "common",
                  lng: interaction.locale,
                })}`
              )
              .setColor(config.embed.error)
              .setFooter({
                text: `${config.footer.text}`,
                iconURL: `${config.footer.icon}`,
              });
            await interaction.followUp({ embeds: [error] }).catch((err) => {});
          });
      })
      .catch(async (err) => {
        client.distube.voices.leave(voiceChannel);
        const error = new EmbedBuilder()
          .setTitle(
            `${t("error.musicerrortitle", {
              ns: "common",
              lng: interaction.locale,
            })}`
          )
          .setDescription(
            `${t("error.musicerrordescription", {
              ns: "common",
              lng: interaction.locale,
            })}`
          )
          .setColor(config.embed.error)
          .setFooter({
            text: `${config.footer.text}`,
            iconURL: `${config.footer.icon}`,
          });
        return await interaction
          .followUp({ embeds: [error] })
          .catch((err) => {});
      });
  },
};
