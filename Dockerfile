FROM node:14.15.5

LABEL version="1.0"
LABEL maintainer = ["tienlm@infoplusvn.com"]

WORKDIR /app

COPY ["package.json","package-lock.json","./"]

RUN npm install 
RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
# RUN apt-get install -y wget
# RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# RUN apt-get install ./google-chrome-stable_current_amd64.deb
RUN apt-get install -y chromium
COPY . .

EXPOSE 5000

CMD ["node" , "app.js"]


