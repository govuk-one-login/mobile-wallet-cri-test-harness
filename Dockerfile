FROM node:lts-bookworm-slim
WORKDIR /workspace
COPY src ./src
COPY test ./test
COPY .nvmrc .npmrc jest.config.ts tsconfig.json package.json package-lock.json run-server-and-tests.sh run-server.sh run-tests.sh ./
RUN mkdir -p /results && \
    npm install && \
    npm run build && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
EXPOSE 3001
ENV PORT=3001
ENTRYPOINT ["bash", "run-server-and-tests.sh"]