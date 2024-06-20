require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const BOTSPAM_CHANNEL_ID = process.env.BOTSPAM_CHANNEL_ID;
const WELCOME_CHANNEL_NAME = process.env.WELCOME_CHANNEL_NAME;
const WELCOME_PROMPT = process.env.WELCOME_PROMPT;

// Logging function
async function logMessage(guild, message) {
    console.log(message);
    if (guild) {
        const botSpamChannel = guild.channels.cache.get(BOTSPAM_CHANNEL_ID);
        if (botSpamChannel) {
            await botSpamChannel.send(message);
        } else {
            console.warn(`Bot spam channel with ID ${BOTSPAM_CHANNEL_ID} not found`);
        }
    } else {
        console.warn('Guild object is null');
    }
}

// Function to describe the image using GPT-4 Vision API
async function describeImage(imagePath) {
    logMessage(null, `Describing image: ${imagePath}`);
    const image = fs.readFileSync(imagePath, { encoding: 'base64' });

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4-turbo',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: "This image is used as a profile pic, describe the main feature in one short sentence fragment with no preamble. I want the output to be akin to 'users avatar is a <sentence fragment>'." },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 50 // Limit the response length
    }, {
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    logMessage(null, `Image described: ${response.data.choices[0].message.content}`);
    return response.data.choices[0].message.content;
}

// Function to generate an image using DALL-E 3
async function generateImage(prompt) {
    logMessage(null, `Generating image with prompt: ${prompt}`);
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: "1024x1024"
    }, {
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    logMessage(null, `Image generated: ${response.data.data[0].url}`);
    return response.data.data[0].url;
}

// Function to download an image from a URL
async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('finish', () => resolve())
            .on('error', e => reject(e));
    });
}

// Function to handle the welcome process
async function welcomeUser(member) {
    const guild = member.guild;
    const username = member.user.username;
    const userId = member.user.id;
    const avatarUrl = member.user.displayAvatarURL({ format: 'png', dynamic: true });

    logMessage(guild, `Triggering welcome process for: ${username}, Avatar URL: ${avatarUrl}`);

    // Check if the user has a default avatar
    if (member.user.avatar === null) {
        await logMessage(guild, `User ${username} does not have a custom avatar. Skipping image generation.`);
        return;
    }

    try {
        // Download the user's avatar
        logMessage(guild, `Downloading avatar for user ${username}`);
        const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarPath = path.join(__dirname, 'avatar.png');
        fs.writeFileSync(avatarPath, avatarResponse.data);
        logMessage(guild, `Avatar downloaded for user ${username} at ${avatarPath}`);

        // Describe the avatar image using GPT-4 Vision
        const description = await describeImage(avatarPath);
        await logMessage(guild, `Image description for ${username}: ${description}`);

        // Generate the DALL-E image using the welcome prompt and the description
        let fullPrompt = WELCOME_PROMPT.replace('{username}', username);
        fullPrompt = fullPrompt.replace('{avatar}', description); // Replace {avatar} with the description
        await logMessage(guild, `Full prompt for DALL-E: ${fullPrompt}`); // Debug log for full prompt
        const imageUrl = await generateImage(fullPrompt);
        await logMessage(guild, `Generated image URL for ${username}: ${imageUrl}`);

        // Download the DALL-E image and re-upload to Discord
        const dalleImagePath = path.join(__dirname, 'dalle_image.png');
        await downloadImage(imageUrl, dalleImagePath);
        logMessage(guild, `DALL-E image downloaded to ${dalleImagePath}`);

        // Send the welcome message with the downloaded and re-uploaded image
        const welcomeChannel = guild.channels.cache.find(channel => channel.name === WELCOME_CHANNEL_NAME);
        if (welcomeChannel) {
            logMessage(guild, `Sending welcome message to ${WELCOME_CHANNEL_NAME} channel`);
            await welcomeChannel.send({
                content: `Welcome, <@${userId}>!`,
                files: [dalleImagePath]
            });
        } else {
            await logMessage(guild, 'Welcome channel not found.');
        }
    } catch (error) {
        await logMessage(guild, `Error generating image for ${username}: ${error.message}`);
    }
}

client.once('ready', async () => {
    try {
        const guild = client.guilds.cache.first();
        await logMessage(guild, 'Bot is online!');
    } catch (error) {
        console.error('Error during ready event:', error);
    }
});

client.on('guildMemberAdd', async member => {
    await welcomeUser(member);
});

client.on('messageCreate', async message => {
    if (message.channel.id === BOTSPAM_CHANNEL_ID && message.content.startsWith('!welcome')) {
        const args = message.content.split(' ');
        if (args.length === 2) {
            const username = args[1];
            const guild = message.guild;
            const member = guild.members.cache.find(member => member.user.username.toLowerCase() === username.toLowerCase());
            if (member) {
                await welcomeUser(member);
            } else {
                await logMessage(message.guild, `User ${username} not found.`);
            }
        } else {
            await logMessage(message.guild, 'Usage: !welcome <username>');
        }
    }
});

client.login(DISCORD_BOT_TOKEN);
