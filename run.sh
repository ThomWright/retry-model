#!/usr/bin/env bash

mkdir plots

MODEL_CONFIG_FILE="./configs/single-service.json" \
  MODEL_OUTPUT="latencies" \
  ts-node retry-model.ts | gnuplot -c histo-freq.plot

MODEL_CONFIG_FILE="./configs/single-service.json" \
  MODEL_OUTPUT="latency_percentiles" \
  ts-node retry-model.ts | gnuplot -c line.plot
