# ExportX Invenue

## Requirement

| Technology | Version |
| ---------- | ------- |
| Node       | V18     |
| MongoDB    |         |

## Development

```
docker compose run --rm \
    -w /home \
    node \
    npm install
```

`docker compose up -d`

`docker compose down`

## Install devependency

    docker compose run --rm \
        -w /home \
        node \
        npm install mongoose swagger-ui-express yamljs --save

### change file ownershp

sudo chown -R $USER: .


## reference

https://serversforhackers.com/dockerized-app/
 