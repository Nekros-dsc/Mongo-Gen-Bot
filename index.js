const discord = require("discord.js");
const client = new discord.Client({
  intents: [32767],
});
const config = require("./config.json");
const {
  createAll,
} = require("./functions/createDb");

if (!config.token)
  throw new Error("Merci de rentrer un token dans config.json ");
if (!config.private_key)
  throw new Error("Merci de rentrer un private key in the config.json");
if (!config.public_key)
  throw new Error("Merci de rentrer un public key in the config.json");
if (!config.org_Id)
  throw new Error("Merci de rentrer un orgId in the config.json");

module.exports = client;

client.on("ready", () => {
  //create the slash cmd
  createSlash();
  console.log("Bot is ready!");
});

//make a slash command
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === "gen") {
      if (!config.owners.includes(interaction.member.user.id))
        return interaction.reply("*Tu n'est pas autorisé à utiliser cette commande*");
      let random_username = Math.random().toString(36).substring(7);
      let random_password = Math.random().toString(36).substring(7);
      interaction.reply({
        ephemeral: false,
        content: "*Je suis entrain de générer la database (cela peut prendre du temps)*",
      });
      let embed = {
        title: "MongoDB URL Generator",
        description: "",
        color: 0x2f3136,
      };
      const authToken = config.private_key;
      const public_key = config.public_key;
      const ipWhitelist = "0.0.0.0";

      //create the db
      let mongo = await createAll(
        random_username,
        authToken,
        public_key,
        ipWhitelist,
        random_username,
        random_password
      );

      embed.description = "**Voici ta database:** " + mongo;
      interaction.editReply({ embeds: [embed] });
    }
  }
});

//simple slash function create cause i'm lazy

function createSlash() {
  client.application.commands.create({
    name: "gen",
    description: "Généré une mongodb",
  });
}

client.login(config.token);
