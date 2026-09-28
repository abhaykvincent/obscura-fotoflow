#!/bin/bash

for port in 8081 9099 5001 5000 9199 4400; do
  PID=$(lsof -ti tcp:$port)

  if [ -n "$PID" ]; then
    echo "Stopping process on port $port (PID $PID)"
    kill $PID 2>/dev/null
  fi
done
