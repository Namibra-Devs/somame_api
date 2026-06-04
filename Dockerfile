# Use an official Node.js Alpine long-term support (LTS) base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Set environment variable to production for optimized Node.js execution
ENV NODE_ENV=production

# Copy package.json and package-lock.json (if present)
# This ensures that the dependency installation step is cached by Docker 
# unless the package files themselves are modified
COPY package*.json ./

# Install only production dependencies
# Note: If a package-lock.json is present, it's safer to use `npm ci --omit=dev`
RUN npm install --omit=dev

# Copy the rest of the application source code into the container
COPY . .

# Expose the port that the Express/Socket.io server listens on
EXPOSE 3000

# Define the command to start the application
CMD ["node", "server.js"]
