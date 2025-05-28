FROM node:lts-bookworm-slim
COPY . /
RUN mkdir -p /results
RUN npm install
EXPOSE 3001
ENV PORT=3001
ENTRYPOINT ["bash", "run-server-and-tests.sh"]