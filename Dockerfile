FROM node:16.17.0 as builder

WORKDIR /code

ADD package.json pnpm-lock.yaml /code/

RUN npm config set registry http://registry.npm.taobao.org/

RUN npm install -g pnpm

RUN pnpm config set registry https://registry.npm.taobao.org/

RUN pnpm install

ADD . /code

EXPOSE 3000




# FROM nginx:alpine
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# COPY --from=builder code/dist /usr/share/nginx/html
CMD ["pnpm" ,"run" ,"prd"]
