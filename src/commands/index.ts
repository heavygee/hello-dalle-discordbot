import { Client, Message } from 'discord.js';
import { welcomeCommand } from './welcome';
import { handleWildcardCommand } from './wildcard';
import { handlePfpCommand } from './pfp';

let pfpAnyoneEnabled = false; // Manage this flag at a global level

export function registerCommands(client: Client): void {
    client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return; // Ignore bot messages

        const { content, channel } = message;

        if (channel.id === process.env.BOTSPAM_CHANNEL_ID || channel.id === process.env.GENERAL_CHANNEL_ID) {
            if (content.startsWith('!welcome')) {
                await welcomeCommand(client, message);
            } else if (content.startsWith('!wildcard')) {
                await handleWildcardCommand(client, message);
            } else if (content.startsWith('!pfp-anyone')) {
                // Toggle the pfp-anyone flag
                pfpAnyoneEnabled = !pfpAnyoneEnabled;
                await message.channel.send(`!pfp command for everyone is now ${pfpAnyoneEnabled ? 'enabled' : 'disabled'}.`);
            } else if (content.startsWith('!pfp')) {
                await handlePfpCommand(client, message, pfpAnyoneEnabled); // Pass the flag
            }
        }
    });
}
