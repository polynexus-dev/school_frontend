# Stage 1: Build the Vite React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package requirements
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build argument for API URL (defaults to http://localhost:6699/api/)
ARG VITE_API_URL=http://localhost:6699/api/
ENV VITE_API_URL=${VITE_API_URL}

# Build production bundle
RUN npm run build

# Stage 2: Serve application with Nginx
FROM nginx:alpine

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
