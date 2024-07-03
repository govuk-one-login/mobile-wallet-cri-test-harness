FROM node:lts-bookworm-slim
COPY . /
RUN npm install && \
    mkdir /results
EXPOSE 3001
#ENTRYPOINT ["npm", "run", "test"]
ENTRYPOINT ["bash", "my_wrapper_script.sh"]
