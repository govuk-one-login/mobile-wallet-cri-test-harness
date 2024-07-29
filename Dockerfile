FROM node:lts-bookworm-slim
COPY . /
RUN npm install && \
    mkdir /results
EXPOSE 3001
ENV PORT=3001
ENTRYPOINT ["bash", "run_all.sh"]
