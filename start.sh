#https://stackoverflow.com/a/697064/13662625

trap 'kill $(jobs -p)' EXIT; until tsx index.ts & wait; do
    echo "server crashed with exit code $?. Respawning.." >&2
    sleep 1
done
