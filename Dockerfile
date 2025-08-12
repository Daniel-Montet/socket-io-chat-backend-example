FROM node:18
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