FROM node:24-bookworm-slim
ENV NODE_ENV=production DATA_DIR=/data PORT=3001
WORKDIR /app
COPY --chmod=644 server.mjs package.json ./
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3001
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3001/health').then(async r=>process.exit(r.ok&&(await r.json()).ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
