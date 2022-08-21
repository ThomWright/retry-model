import { readFileSync } from "fs";
import { stdout } from "process";

const erlang_dist = require("@stdlib/random-base-erlang");

interface Config {
  call_depths: Array<number>;
  failure_rates: Array<number>;
  max_retry_values: Array<number>;
  retry_strategies: Array<"all" | "top_only">;
  backoff_bases: Array<number>;
  /**
   * - "all"         – Every service has a chance of failing.
   * - "bottom_only" – Only the dependency at the bottom of the call stack fails.
   *                    Useful for modelling an outage with a high `failure_rate`.
   */
  failure_type: "all" | "top_only";
}
interface Result {
  latency: number;
  success: boolean;
}
interface Service {
  req_count(): number;

  request({
    retry,
    time_since_first_attempt,
  }: {
    retry: boolean;
    time_since_first_attempt: number;
  }): Result;
}
interface Summary {
  "Call depth": number;
  "Service failure rate": number;
  "Max retries": number;
  "Backoff base": number;
  "Retry strategy": string;

  // TODO: success latencies and failure latencies?
  "Average latency": number;
  "P99 latency": number;
  "Success rate": number;
  Load: number | string;
}

// Assume each service does some actual work
const service_latency = erlang_dist.factory(5, 1);

function create_service(
  dependency: Service | undefined,
  failure_rate: number,
  max_retries: number,
  backoff_base: number
) {
  let req_count = 0;

  const service: Service = {
    req_count() {
      return req_count;
    },

    request({ retry, time_since_first_attempt }) {
      req_count++;

      // Retries are more likely to success the longer they wait.
      // Will always succeed after `recovery_time` ms.
      // This is just linear for now for simplicity.
      const recovery_time = 2000;
      const scale = retry
        ? 1 / Math.min(time_since_first_attempt / recovery_time, 1)
        : 1;
      const succeed = Math.random() > failure_rate * scale;

      if (dependency == null) {
        return {
          latency: service_latency(),
          success: succeed,
        };
      }

      let res = dependency.request({
        retry: false,
        time_since_first_attempt: 0,
      });

      let retries = 0;
      let retry_latency = 0;
      while (res.success == false && retries < max_retries) {
        // Back off with jitter
        retry_latency += backoff_base * Math.pow(2, retries) * Math.random();

        res = dependency.request({
          retry: true,
          time_since_first_attempt: retry_latency,
        });

        retries++;
      }

      return {
        latency:
          res.latency +
          retry_latency +
          // If this is a retry, assume we can skip some work sometimes because we've already done it
          (retry ? Math.random() * service_latency() : service_latency()),
        success: res.success && succeed,
      };
    },
  };
  return service;
}

function run(n = 10_000, config: Config, output = "table") {
  const {
    call_depths,
    failure_rates,
    max_retry_values,
    retry_strategies,
    backoff_bases,
    failure_type,
  } = config;

  const combinations = call_depths.flatMap((call_depth) =>
    failure_rates.flatMap((failure_rate) =>
      max_retry_values.flatMap((max_retries) =>
        max_retries == 0
          ? [
              {
                call_depth,
                failure_rate,
                max_retries,
                backoff_base: 0,
                retry_strategy: "none",
              },
            ]
          : backoff_bases.flatMap((backoff_base) =>
              retry_strategies.map((retry_strategy) => ({
                call_depth,
                failure_rate,
                max_retries,
                backoff_base,
                retry_strategy,
              }))
            )
      )
    )
  );

  const summaries: Array<{ results: Array<Result>; summary: Summary }> = [];

  for (const {
    call_depth,
    failure_rate,
    max_retries,
    backoff_base,
    retry_strategy,
  } of combinations) {
    const bottom_service = create_service(undefined, failure_rate, 0, 0);
    const server: Service =
      call_depth > 1
        ? create_service(
            Array.from(Array(call_depth - 1)).reduce(
              (dependency) =>
                create_service(
                  dependency,
                  failure_type == "all" ? failure_rate : 0,
                  retry_strategy == "all" ? max_retries : 0,
                  backoff_base
                ),
              bottom_service
            ),
            failure_type == "all" ? failure_rate : 0,
            max_retries,
            backoff_base
          )
        : bottom_service;

    const results: Array<Result> = [];
    for (let step = 0; step < n; step++) {
      results.push(
        server.request({ retry: false, time_since_first_attempt: 0 })
      );
    }

    summaries.push({
      results,
      summary: {
        "Call depth": call_depth,
        "Service failure rate": failure_rate,
        "Max retries": max_retries,
        "Backoff base": backoff_base,
        "Retry strategy": retry_strategy,

        "Average latency":
          results.reduce((total, { latency }) => total + latency, 0) /
          results.length,
        "P99 latency": results.sort((a, b) => a.latency - b.latency)[
          Math.ceil(0.99 * results.length)
        ].latency,
        "Success rate":
          results.reduce(
            (successes, { success }) => (success ? successes + 1 : successes),
            0
          ) / results.length,
        Load: new Intl.NumberFormat("en-GB").format(bottom_service.req_count()),
      },
    });
  }

  switch (output) {
    // Output a summary table of all the results
    case "table": {
      console.log("Failure type: " + failure_type);
      console.table(summaries.map((s) => s.summary));
      break;
    }

    // Output the sorted latencies for the first set of results
    case "latencies": {
      const latencies = summaries[0].results
        .map((r) => r.latency)
        .sort((a, b) => a - b);
      latencies.forEach((l) => {
        stdout.write(`${l}\n`);
      });
      break;
    }

    // Output the latency percentiles for the first set of results
    case "latency_percentiles": {
      const latencies = summaries[0].results
        .map((r) => r.latency)
        .sort((a, b) => a - b);

      const percentiles = latencies
        .map((l, i) => [Math.floor((i * 100) / latencies.length), l])
        .reduce((acc, [p, l]) => {
          if (p === acc.length) {
            acc.push([p, l]);
          }
          return acc;
        }, [] as Array<[number, number]>);

      percentiles.push([100, latencies[latencies.length - 1]]);

      percentiles.forEach(([p, l]) => {
        stdout.write(`${p} ${l}\n`);
      });
    }

    default:
      break;
  }
}

run(
  10_000,
  JSON.parse(
    readFileSync(process.env["MODEL_CONFIG_FILE"] as string).toString()
  ) as Config,
  process.env["MODEL_OUTPUT"]
);
