FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host is required so Vite's dev server is reachable from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
