FROM node:18-alpine

WORKDIR /usr/src/app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Add error handling for node process
CMD ["node", "--unhandled-rejections=strict", "server.js"]