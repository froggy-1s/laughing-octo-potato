FROM node:18

# Install build tools for native compilation
RUN apt-get update && apt-get install -y build-essential python3

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including native modules)
RUN npm install

# Copy the rest of the project files
COPY . .

# Run your app (adjust if you use a different start command)
CMD ["node", "src/index.js"]
