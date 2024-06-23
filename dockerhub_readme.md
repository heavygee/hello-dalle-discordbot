## Hello DALL-E DiscordBot

### Overview

The Discord DALL-E Bot leverages OpenAI's DALL-E model to generate welcome images for new members joining your Discord server. When a new member joins, the bot uses their avatar and a customizable prompt to create a unique welcome image, ensuring each member feels special.

### Features

- **Automated Welcome Messages**: Automatically generates and sends welcome images when new members join your server.
- **Customizable Prompts**: Use environment variables to customize the welcome message and image generation prompt.
- **Dynamic Avatar Description**: Utilizes GPT-4 Vision capabilities to describe user avatars dynamically.
- **Secure Configuration**: Environment variables ensure sensitive information like API keys and tokens are not included in the Docker image.
- **Wildcard Feature**: Introduces variability in the prompts with a configurable chance of using an alternate prompt (default is 0% / disabled. 99 is max for 99% likely).
- **Image Storage**: Saves generated welcome images to a `welcome_images` subfolder with filenames based on the username and timestamp.

### Getting Started

#### Prerequisites

- Discord Bot Token
- OpenAI API Key

#### Environment Variables

Create a `.env` file with the following variables:

```plaintext
DISCORD_BOT_TOKEN=your_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
BOTSPAM_CHANNEL_ID=your_botspam_channel_id
WELCOME_CHANNEL_NAME=new-users
WELCOME_PROMPT=Create a welcome image for a new Discord user with the username '{username}'. Incorporate the user's avatar into the image, its described as: {avatar}
WILDCARD=0
```

### Usage

#### Docker Run
To run the bot using Docker, use the following command:
```
docker run -d --name hello-dalle-discordbot --env-file .env heavygee/hello-dalle-discordbot
```

#### Docker Compose
Alternatively, use Docker Compose for a more robust setup. Create a docker-compose.yml file:

```plaintext
version: '3.8'
services:
  hello-dalle-discordbot:
    image: heavygee/hello-dalle-discordbot
    environment:
      - DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - BOTSPAM_CHANNEL_ID=${BOTSPAM_CHANNEL_ID}
      - WELCOME_CHANNEL_NAME=${WELCOME_CHANNEL_NAME}
      - WELCOME_PROMPT=${WELCOME_PROMPT}
      - WILDCARD=${WILDCARD}
    env_file:
      - .env
    volumes:
      - ./welcome_images:/usr/src/app/welcome_images
```

This \`volumes\` directive ensures that the \`welcome_images\` directory on your host machine is bound to the corresponding directory inside the Docker container. This allows you to store generated images outside the container and access them easily.

Run the container using Docker Compose:
```
docker-compose up -d
```

### License
This project is licensed under the MIT License. See the LICENSE file for details.

### Authors
- HeavyGee
- ChatGPT (by OpenAI) - Chad wrote the whole damn thing.

### Support
For issues, please open an issue on the [GitHub repository](https://github.com/heavygee/hello-dalle-discordbot).
