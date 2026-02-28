FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Claude Code CLI 설치
RUN npm install -g @anthropic-ai/claude-code

COPY tsconfig.json ./
COPY src/ ./src/

CMD ["npm", "start"]
