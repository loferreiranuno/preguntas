FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build with environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]