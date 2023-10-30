FROM node:19.0.0-bullseye

ENV APP_FOLDER=/service

COPY . ${APP_FOLDER}
WORKDIR ${APP_FOLDER}

RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
