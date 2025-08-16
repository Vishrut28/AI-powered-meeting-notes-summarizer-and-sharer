# syntax=docker/dockerfile:1
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Run the server
CMD ["npm", "start"]