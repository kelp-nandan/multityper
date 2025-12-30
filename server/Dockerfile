FROM node:20-alpine AS builder 

WORKDIR /app 

#copy package files
COPY package*.json ./ 

#dependencies
RUN npm i 

COPY . .


EXPOSE 3000 

CMD [ "npm", "run", "start:dev" ]