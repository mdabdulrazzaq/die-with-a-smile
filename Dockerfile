# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to the server folder
WORKDIR /usr/src/app/server

# Copy the package.json and package-lock.json files from the server directory to the container
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code from the server directory to the container
COPY server/ .

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run your app (assuming index.js is the entry point)
CMD ["node", "index.js"]
