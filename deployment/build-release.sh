#!/usr/bin/env sh
USER_GROUP="$(id -u):$(id -g)" docker-compose build --no-cache --build-arg TI_ACCESS_TOKEN=$TI_ACCESS_TOKEN glowing-bear-medco