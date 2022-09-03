#!/usr/bin/env bash

mkdir -p plots
# rm plots/*
mkdir -p tmp


# Test

MODEL_CONFIG_FILE="./configs/2-failures.json" \
  MODEL_OUTPUT="table" \
  ts-node retry-model.ts

MODEL_CONFIG_FILE="./configs/2-by-failure-rate.json" \
  MODEL_OUTPUT="table" \
  ts-node retry-model.ts

MODEL_CONFIG_FILE="./configs/2-by-backoff-base.json" \
  MODEL_OUTPUT="table" \
  ts-node retry-model.ts

MODEL_CONFIG_FILE="./configs/4-test.json" \
  MODEL_OUTPUT="table" \
  ts-node retry-model.ts

# Single service

MODEL_CONFIG_FILE="./configs/1-perfect.json" \
  MODEL_OUTPUT="latencies" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-dist.plot \
  > ./pngs/1-perfect-latencies.png

MODEL_CONFIG_FILE="./configs/1-perfect.json" \
  MODEL_OUTPUT="latency_percentiles" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-percentiles.plot \
  > ./pngs/1-perfect-percentiles.png

# With a perfect dependency

MODEL_CONFIG_FILE="./configs/2-perfect.json" \
  MODEL_OUTPUT="latencies" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-dist.plot \
  > ./pngs/2-perfect-latencies.png

MODEL_CONFIG_FILE="./configs/2-perfect.json" \
  MODEL_OUTPUT="latency_percentiles" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-percentiles.plot \
  > ./pngs/2-perfect-percentiles.png

# With dependency failures

MODEL_CONFIG_FILE="./configs/2-failures.json" \
  MODEL_OUTPUT="latencies" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-dist.plot \
  > ./pngs/2-failures-latencies.png

MODEL_CONFIG_FILE="./configs/2-failures.json" \
  MODEL_OUTPUT="latency_percentiles" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-percentiles.plot \
  > ./pngs/2-failures-percentiles.png

# Dependency failures by failure rate

MODEL_CONFIG_FILE="./configs/2-by-failure-rate.json" \
  MODEL_OUTPUT="ssv" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-by-failure-rate.plot \
  > ./pngs/2-latency-by-failure-rate.png
gnuplot -c plots/success-by-failure-rate.plot \
  > ./pngs/2-success-by-failure-rate.png
gnuplot -c plots/load-by-failure-rate.plot \
  > ./pngs/2-load-by-failure-rate.png

# Dependency failures by failure rate (with shorter backoff)

MODEL_CONFIG_FILE="./configs/2-by-failure-rate-shorter.json" \
  MODEL_OUTPUT="ssv" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-by-failure-rate.plot \
  > ./pngs/2-shorter-latency-by-failure-rate.png
gnuplot -c plots/success-by-failure-rate.plot \
  > ./pngs/2-shorter-success-by-failure-rate.png
gnuplot -c plots/load-by-failure-rate.plot \
  > ./pngs/2-shorter-load-by-failure-rate.png

# Higher call depth

MODEL_CONFIG_FILE="./configs/4-all.json" \
  MODEL_OUTPUT="ssv" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-by-failure-rate.plot \
  > ./pngs/4-all-latency-by-failure-rate.png
gnuplot -c plots/success-by-failure-rate.plot \
  > ./pngs/4-all-success-by-failure-rate.png
gnuplot -c plots/load-by-failure-rate.plot \
  > ./pngs/4-all-load-by-failure-rate.png

MODEL_CONFIG_FILE="./configs/4-top-only.json" \
  MODEL_OUTPUT="ssv" \
  ts-node retry-model.ts > tmp/data.dat
gnuplot -c plots/latency-by-failure-rate.plot \
  > ./pngs/4-top-only-latency-by-failure-rate.png
gnuplot -c plots/success-by-failure-rate.plot \
  > ./pngs/4-top-only-success-by-failure-rate.png
gnuplot -c plots/load-by-failure-rate.plot \
  > ./pngs/4-top-only-load-by-failure-rate.png
