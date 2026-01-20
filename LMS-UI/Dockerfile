# Changed from alpine to slim to fix the missing binding error
FROM node:22-slim as BUILD_IMAGE
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=BUILD_IMAGE /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]