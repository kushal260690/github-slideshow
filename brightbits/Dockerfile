# Brightbits: frontend + API in one container.
FROM node:22-alpine
ENV NODE_ENV=production PORT=8787 DATABASE_PATH=/data/brightbits.db
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev
COPY index.html app.js api.js data.js styles.css ./
COPY server/src server/src
RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 8787
USER node
CMD ["node", "--disable-warning=ExperimentalWarning", "server/src/index.js"]
