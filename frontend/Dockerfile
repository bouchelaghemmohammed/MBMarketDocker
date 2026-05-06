# Stage 1: Build Angular app
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copy nginx config as a template (PORT will be substituted at runtime)
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# The official nginx image automatically processes /etc/nginx/templates/*.template
# using envsubst — replacing ${PORT} with Render's PORT env var at startup.
