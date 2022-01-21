FROM node:14-buster as builder

WORKDIR /usr/src/app

COPY . .

RUN npm i -g npm@latest --registry=https://registry.npmjs.org --silent

RUN npm ci --silent

RUN npm run build

COPY --from=build /usr/src/app/build usr/share/nginx/html

VOLUME [ "/etc/nginx/conf.d/default.conf" ]

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
