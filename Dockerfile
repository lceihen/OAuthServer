FROM node:16.17.0 as builder

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /code

ADD package.json pnpm-lock.yaml /code/

RUN npm config set registry http://registry.npm.taobao.org/

RUN npm install -g pnpm

RUN pnpm config set registry https://registry.npm.taobao.org/

RUN pnpm install

ADD . /code

EXPOSE 3000


CMD ["pnpm" ,"run" ,"prd"]
