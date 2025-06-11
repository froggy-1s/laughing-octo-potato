FROM node:18

# Install build tools including CMake
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    cmake

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "src/index.js"]
