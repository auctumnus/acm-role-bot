import { Client, Events, GatewayIntentBits, GuildMemberRoleManager, REST, Routes, SlashCommandBuilder } from "discord.js"
import roles from './roles.json'

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once(Events.ClientReady, client => {
    console.log(`Logged in as ${client.user?.tag}`)
})

const roleChoices = Object.entries(roles).map(([name, id]) => ({ name, value: id }))

const roleCommandData = new SlashCommandBuilder()
    .setName('role')
    .setDescription('Assign or remove roles')
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a role')
            .addStringOption(option => option
                .setName('role')
                .setDescription('The role to add')
                .addChoices(...roleChoices)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a role')
            .addStringOption(option => option
                .setName('role')
                .setDescription('The role to remove')
                .addChoices(...roleChoices)
            )
    )

const pingCommandData = new SlashCommandBuilder()
    .setName('hi')
    .setDescription('hi paracelsus')

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) { return }
    if(interaction.commandName === 'hi') {
        interaction.reply('hi')
    } else if(interaction.commandName === 'role') {
        const subcommand = interaction.options.getSubcommand()
        const role = interaction.options.getString('role')
        if(!role) {
            interaction.reply('You must specify a role.')
            return
        }
        const member = interaction.member
        if(!member) {
            interaction.reply('You must use this command from a server.')
            return
        }
        if(!(member.roles instanceof GuildMemberRoleManager)) {
            interaction.reply('guoh')
            return
        }
        // @ts-ignore
        const roleName = Object.keys(roles).find(name =>  roles[name] === role)
        if(subcommand === 'add') {
            member.roles.add(role)
            interaction.reply(`Added role ${roleName}.`)
        } else if(subcommand === 'remove') {
            member.roles.remove(role)
            interaction.reply(`Removed role ${roleName}.`)
        }
    }
})

// register commands and log in
const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID

if(!TOKEN) {
    console.error('No token provided')
    process.exit(1)
}

if(!CLIENT_ID) {
    console.error('No client id provided')
    process.exit(1)
}

const rest = new REST().setToken(TOKEN)

try {
    console.log('Registering commands ...')
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [roleCommandData, pingCommandData] })
    console.log(`Registered ${(data as unknown[]).length} commands`)

    console.log('Logging in ...')
    await client.login(TOKEN)
} catch (e) {
    console.error(e)
    process.exit(1)
}
