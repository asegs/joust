trap 'kill $(jobs -p)' EXIT; until tsx index.ts & wait; do
    echo "ldap proxy crashed with exit code $?. Respawning.." >&2
    sleep 1
done
