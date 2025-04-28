# ---- Build Stage ----
    FROM node:20 as build-stage

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build
    
    # ---- Production Stage ----
    FROM nginx:stable-alpine as production-stage
    
    # Remove default nginx website
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy built frontend files from build-stage
    COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
    
    # Copy custom nginx config (optional)
    # COPY nginx.conf /etc/nginx/nginx.conf
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]
    