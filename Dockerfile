FROM node:alpine
RUN apk add --no-cache bash

ENV HOST=0.0.0.0

RUN mkdir -p /var/app
WORKDIR /var/app

# Install dependencies
COPY package.json /var/app
RUN npm install

COPY . /var/app

EXPOSE 8080

CMD [ "npm", "start" ]
