FROM node:lts-bookworm-slim
COPY . /
RUN npm install && \
    mkdir /results
EXPOSE 3001
#ENV CRI_DOMAIN $criDomain
#ENV WALLET_SUBJECT_ID $walletSubjectId
#ENV CREDENTIAL_OFFER_DEEP_LINK $credentialOffer
ENTRYPOINT ["bash", "run_all.sh"]
