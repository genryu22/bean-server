FROM node:18 AS install_node_modules

WORKDIR /bean_server_app

COPY package.json /bean_server_app
COPY package-lock.json /bean_server_app

RUN npm install

COPY tsconfig.json /bean_server_app
COPY entrypoint.sh /bean_server_app

CMD ["/bin/bash", "./entrypoint.sh"]