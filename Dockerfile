# Use the official Node.js image as the base
FROM node:21-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the entire project
COPY . .
COPY ./prisma ./prisma

RUN npx prisma generate --schema=./prisma/schema.prisma

# Build the NestJS application
RUN npm run build

# Expose the port the app will run on
EXPOSE 4400

# Start the NestJS application
CMD ["npm", "run", "start:prod"]
