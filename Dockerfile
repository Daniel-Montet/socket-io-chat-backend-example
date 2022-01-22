FROM node:16
WORKDIR /app
COPY package.json .

ARG NODE_ENV

RUN if [ "${NODE_ENV}" = "development" ]; \
	then npm install; \
	else npm install --only=production; \
	fi
RUN npm install
COPY . ./
ENV PORT 8000
EXPOSE $PORT


# RUN npm install
# RUN if [ "${NODE_ENV}" = "production" ]; \
# 	then npm prune \
# 	fi
# CMD ["npm","run","dev"]