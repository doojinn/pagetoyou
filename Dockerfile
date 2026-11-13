FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json gift-validation.cjs cloud-client.js server.cjs backend.cjs index.html studio.js studio.css account.js account.css gift-effects.js gift-effects.css stationery.js stationery.css photo-scenes.js photo-scenes.css photo-space.js tree-webgl.js tree-webgl.css ./
COPY vendor ./vendor
COPY assets ./assets
RUN mkdir -p /data && chown node:node /data
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4175 DATA_DIR=/data
USER node
VOLUME ["/data"]
EXPOSE 4175
CMD ["node", "server.cjs"]
