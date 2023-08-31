(async () => {
  const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    Discord,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    ActivityType,
    TextInputStyle,
    TextInputBuilder,
    ModalBuilder,
    InteractionType,
  } = require("discord.js"); // Discord.js V14
  const { default: mongoose } = require("mongoose"); // Mongoose
  const chalk = require("chalk");
  const config = require("./config.js"); // Config
  const i18next = require("i18next"); // i18next
  const { t } = require("i18next"); // i18next Translate
  const translationBackend = require("i18next-fs-backend"); // i18next-fs-backend
  const { readdirSync } = require("fs");
  const moment = require("moment"); // Moment
  const timezones = require("moment-timezone"); // Moment Timezone
  const { REST } = require("@discordjs/rest"); // Discord.js REST
  const { Routes } = require("discord-api-types/v10"); // Discord.js Routes
  const { DisTube } = require("distube"); // DisTube
  const { SpotifyPlugin } = require("@distube/spotify"); // DisTube Spotify Plugin
  const { SoundCloudPlugin } = require("@distube/soundcloud"); // DisTube SoundCloud Plugin
  const { YtDlpPlugin } = require("@distube/yt-dlp"); // DisTube YtDlp Plugin
  const { Player } = require("discord-player"); // Discord Player
  const music_mongo = require("./models/music.js"); // Music Model
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildBans,
    ],
  }); // Client
  const player = new Player(client);
  client.player = player;
  client.distube = new DisTube(client, {
    leaveOnStop: false,
    leaveOnEmpty: true,
    leaveOnFinish: true,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
      new SpotifyPlugin({
        emitEventsAfterFetching: true,
      }),
      new SoundCloudPlugin(),
      new YtDlpPlugin(),
    ],
  });
  require("./loader.js")(client); // Loader

  mongoose
    .connect(config.mongodb, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(
        chalk.bold.yellow(`[MongoDB]:`),
        chalk.bold.blue(`MongoDB Database Connected!`)
      );
    })
    .catch((err) => {
      console.log(
        chalk.hex("#FF0000").bold(`[MongoDB]:`),
        chalk.bold.blue(`MongoDB Database Connection Failed! Error: ${err}`)
      );
    }); // MongoDB Connection
  client
    .login(config.token)
    .then(() => {
      console.log(
        chalk.hex("#067A00").bold(`[Bot]:`),
        chalk.bold.blue(`${client.user.tag} Login Succesfully`)
      ); // Giriş başarılıysa bot aktif olur.
    })
    .catch((err) => {
      console.log(chalk.hex("#FF0000").bold(`Entry failed!${err}`)); // Giriş başarısızsa hata verir.
    });

  // Initialize multi language system
  i18next.use(translationBackend).init({
    ns: readdirSync("./locales/en-US").map((a) => a.replace(".json", "")),
    defaultNS: "commands",
    fallbackLng: "en-US",
    preload: readdirSync("./locales"),
    backend: {
      loadPath: "./locales/{{lng}}/{{ns}}.json",
    },
  }); // i18next

  client.on("ready", async () => {
    client.guilds.cache.filter(async (guild) => {
      const data = await music_mongo.find({});
      if (!data) return;
      await music_mongo.remove({}).catch((err) => {});
    });

    console.log(
      chalk.bold.magenta(`[SlashCommands]:`),
      chalk.bold.blue(`${client.slashCommands.size} commands loaded.`)
    ); // Slash Commands
    var status = config.ready; // Ready Status
    setInterval(function () {
      client.user.setActivity(
        ` ${status[Math.floor(Math.random() * status.length)]}`,
        {
          type: ActivityType.Listening,
        }
      );
    }, config.ready_event_loop_time); // Ready Event Loop Time (ms) 5000ms = 5s
  }); // Ready Event

  client.distube.on("finish", async (queue) => {
    client.guilds.cache.filter(async (guild) => {
      const data = await music_mongo.findOne({ guildId: guild.id });
      if (!data) return;
      const message = data.interactionId;
      const channels = data.channelId;
      const channel = guild.channels.cache.get(channels);
      const finished = new EmbedBuilder()
        .setTitle("Song Finished!")
        .setDescription("You can use the /play command to start a new song")
        .setFooter({
          text: `${config.footer.text}`,
          iconURL: `${config.footer.icon}`,
        });

        channel.send({ embeds: [finished], components: [] })
            .catch((err) => {});
  
    });
  }); // DisTube Finish Event

  client.distube.on("empty", async (queue) => {
    const data = await music_mongo.findOne({ guildId: queue.id });
    if (!data) return;
    const empty = new EmbedBuilder()
      .setTitle("Hey!")
      .setDescription("Channel is empty. Leaving the channel")
      .setFooter({
        text: `${config.footer.text}`,
        iconURL: `${config.footer.icon}`,
      })
      .setColor(config.embed.error);
    const channelleave = client.channels.cache.get(data.channelId);
    channelleave.send({ embeds: [empty] }).catch((err) => {});
  }); // DisTube Empty Event

  client.distube.on("error", (channel, e) => {
    if (channel) channel.send(`An error encountered: ${e}`);
    else console.error(e);
  });
  client.distube.on("searchCancel", (interaction) => {
    const cancelsearch = new EmbedBuilder()
      .setTitle("Cancelled!")
      .setDescription("Searching canceled, Please try Again.")
      .setFooter({
        text: `${config.footer.text}`,
        iconURL: `${config.footer.icon}`,
      })
      .setColor(config.embed.error);
    interaction.channel.send({ embeds: [cancelsearch] }).catch((err) => {});
  });
  client.distube.on("searchInvalidAnswer", (message) => {
    message.channel.send(`You answered an invalid number!`).catch((err) => {});
  });
  client.distube.on("searchNoResult", (message, query) => {
    message.channel.send(`No result found for ${query}!`).catch((err) => {});
  });

  //Volume Play commands Volume
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId == "volume") {
        const modalvolume = new ModalBuilder()
          .setCustomId("formvolume")
          .setTitle("Set Volume");
        const a1 = new TextInputBuilder()
          .setCustomId("setvolume")
          .setLabel("Volume")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(1)
          .setPlaceholder("1 - 100")
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(a1);

        modalvolume.addComponents(row);
        await interaction.showModal(modalvolume)
      }
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.type !== InteractionType.ModalSubmit) return;
    if (interaction.customId === "formvolume") {
      const string = interaction.fields.getTextInputValue("setvolume");
      const volume = parseInt(string);
      const queue = client.distube.getQueue(interaction);
      if (!queue)
        return interaction
          .reply(`There is no song on the list yet.`)
          .catch((err) => {});
      if (isNaN(volume))
        return interaction.reply("Give me number!").catch((err) => {});
      if (volume < 1)
        return interaction
          .reply("The number must not be less than 1.")
          .catch((err) => {});
      if (volume > 100)
        return interaction
          .reply("The number should not be greater than 100.")
          .catch((err) => {});
      client.distube.setVolume(interaction, volume)
      interaction
        .reply("Successfully set the volume of the music to **" + volume + "**")
        .catch((err) => {});
    }
  });
//Play Command Volume



//Skip Command Volume
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId == "volumes") {
      const modalvolume = new ModalBuilder()
        .setCustomId("formvolumes")
        .setTitle("Set Volume");
      const a1 = new TextInputBuilder()
        .setCustomId("setvolumes")
        .setLabel("Volume")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setPlaceholder("1 - 100")
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(a1);

      modalvolume.addComponents(row);
      await interaction.showModal(modalvolume)
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.type !== InteractionType.ModalSubmit) return;
  if (interaction.customId === "formvolumes") {
    const string = interaction.fields.getTextInputValue("setvolumes");
    const volume = parseInt(string);
    const queue = client.distube.getQueue(interaction);
    if (!queue)
      return interaction
        .reply(`There is no song on the list yet.`)
        .catch((err) => {});
    if (isNaN(volume))
      return interaction.reply("Give me number!").catch((err) => {});
    if (volume < 1)
      return interaction
        .reply("The number must not be less than 1.")
        .catch((err) => {});
    if (volume > 100)
      return interaction
        .reply("The number should not be greater than 100.")
        .catch((err) => {});
    client.distube.setVolume(interaction, volume)
    interaction
      .reply("Successfully set the volume of the music to **" + volume + "**")
      .catch((err) => {});
  }
});
//Skip Command Volume

//Loop Command Play
client.on("interactionCreate",async (interaction) => {
  if (interaction.customId === "loop") {
    const queue = client.distube.getQueue(interaction);
       if (!queue) return interaction.reply(`${t("error.nosonglist", {
        ns: "common",
        lng: interaction.locale,
      })}`)
    let data = await music_mongo.findOne({ guildId: interaction.guild.id });
    if (!data) return interaction.reply({content: `${t("error.dataerror", {
      ns: "common",
      lng: interaction.locale,
    })}`, ephemeral: true})
    let userr = data.userId
    if (interaction.user.id !== userr) return interaction.reply({content: `${t("error.onlyuser", {
      ns: "common",
      lng: interaction.locale,
    })}`, ephemeral: true})
  const title = data.title
  const author = data.uploader
  const time = data.time
  const view = data.views
  const thumb = data.thumbnail
  const url = data.video
  
  const views = view;
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
if (queue.repeatMode === 0) {
  const embed = new EmbedBuilder()
  .setTitle(
    `${t("succes.songloopon", {
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
  
  client.distube.setRepeatMode(interaction, 1)
  return interaction.reply({embeds: [embed]}).catch((err) => {});
  } else if(queue.repeatMode === 1) {
    const embed = new EmbedBuilder()
    .setTitle(
      `${t("succes.songloopoff", {
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
    
    .setColor(config.embed.error)
    .setFooter({
      text: `${config.footer.text}`,
      iconURL: `${config.footer.icon}`,
    });
    
    client.distube.setRepeatMode(interaction, 0)
    return interaction.reply({embeds: [embed]}).catch((err) => {});
  }
}
});
//Loop Command Play

//Loop Command Skip
client.on("interactionCreate", async (interaction) => {
  if (interaction.customId === "loops") {
    const queue = client.distube.getQueue(interaction);
       if (!queue) return interaction.reply(`${t("error.nosonglist", {
        ns: "common",
        lng: interaction.locale,
      })}`)
    let data = await music_mongo.findOne({ guildId: interaction.guild.id });
    if (!data) return interaction.reply({content: `${t("error.dataerror", {
      ns: "common",
      lng: interaction.locale,
    })}`, ephemeral: true})
    let userr = data.userId
    if (interaction.user.id !== userr) return interaction.reply({content: `${t("error.onlyuser", {
      ns: "common",
      lng: interaction.locale,
    })}`, ephemeral: true})
  const title = data.title
  const author = data.uploader
  const time = data.time
  const view = data.views
  const thumb = data.thumbnail
  const url = data.video
  
  const views = view;
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
if (queue.repeatMode === 0) {
  const embed = new EmbedBuilder()
  .setTitle(
    `${t("succes.songloopon", {
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
  
  client.distube.setRepeatMode(interaction, 1)
  return interaction.reply({embeds: [embed]}).catch((err) => {});
  } else if(queue.repeatMode === 1) {
    const embed = new EmbedBuilder()
    .setTitle(
      `${t("succes.songloopoff", {
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
    
    .setColor(config.embed.error)
    .setFooter({
      text: `${config.footer.text}`,
      iconURL: `${config.footer.icon}`,
    });
    
    client.distube.setRepeatMode(interaction, 0)
    return interaction.reply({embeds: [embed]}).catch((err) => {});
  }
}
});
//Loop Command SKip
})();

/* Powered by:
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          F a s t - U p t i m e           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
------ Developed by Egehan#7658 ------
https://github.com/egehan0250
https://www.linkedin.com/in/egehan-konta%C5%9F-a91986250
https://stackoverflow.com/users/18989055/egehan
*/
