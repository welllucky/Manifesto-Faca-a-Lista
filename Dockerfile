# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application code (exclude .env to use environment variables from Coolify)
COPY . .
RUN rm -f .env

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]