FROM nginx:alpine

# Removing default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443