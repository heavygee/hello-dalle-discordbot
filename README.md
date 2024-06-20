# Discord DALL-E Bot

This bot uses OpenAI's DALL-E to generate welcome images for new Discord members. It describes the user's avatar and generates an image based on a prompt.

## Features
- Automatically welcome new members with a custom image.
- Generate images using DALL-E and re-upload to Discord to avoid expiration.

## Installation

### Prerequisites
- Node.js
- Docker (optional)

### Environment Variables
Create a `.env` file in the root of your project with the following variables:

```plaintext
DISCORD_BOT_TOKEN=your_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
BOTSPAM_CHANNEL_ID=your_botspam_channel_id
WELCOME_CHANNEL_NAME=new-users
WELCOME_PROMPT=Create a welcome image for a new Discord user with the username '{username}'. Incorporate the users avatar into the image, its described as: {avatar}
