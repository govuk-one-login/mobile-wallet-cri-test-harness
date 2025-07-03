FROM node:lts-bookworm-slim
WORKDIR /workspace
COPY src/ test/ .nvmrc jest.config.ts tsconfig.json package.json package-lock.json run-server-and-tests.sh run-server.sh run-tests.sh ./
RUN mkdir -p /results
RUN npm install
RUN npm run build
EXPOSE 3001
ENV PORT=3001
ENTRYPOINT ["bash", "run-server-and-tests.sh"]