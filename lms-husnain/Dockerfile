FROM node:22-slim

# Install Python (for your AI scripts)
RUN apt-get update && apt-get install -y python3 python3-pip make g++

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy all backend code
COPY . .

# Run the server
EXPOSE 5000
CMD ["npm", "run", "dev"]