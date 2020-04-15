# Pound sign at the beginning of line is comment
# Install node version 13 from Docker Hub
FROM node:13 

# Set working directory for Docker image
WORKDIR /usr/src/app

# Copy files from current directory into working directory on the image
COPY . .

# Run "npm install" to install all dependencies
RUN npm install

# Set environment variable
ENV PORT=8080

# Indicate that containers based on this image will listen to the specified port
EXPOSE ${PORT}

# Set default command to be run when creating a container from this image
CMD ["npm", "start"]