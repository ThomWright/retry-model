# Retry model

## Dependencies

- Node.js
- Gnuplot

## Running

- Install dependencies: `npm ci`
- Install `ts-node`: `npm i -g ts-node`
- Run:

    ```bash
    MODEL_CONFIG_FILE="./configs/2-by-failure-rate-shorter.json" \
      MODEL_OUTPUT="table" \
      ts-node retry-model.ts
    ```
