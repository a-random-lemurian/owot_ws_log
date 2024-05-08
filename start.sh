#!/bin/sh
# immediately starts up a logger and then runs tail -f on the log file.

log="logs/$(date --iso-8601=seconds).log"

node build/src/index.js -C config.json start &> $log &
tail -f $log

