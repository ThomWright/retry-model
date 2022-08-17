// const beta_dist = require("@stdlib/random-base-beta");
const beta_dist_pdf = require("@stdlib/stats-base-dists-beta-pdf");
const erlang_dist = require("@stdlib/random-base-erlang");

interface Result {
  latency: number;
  success: boolean;
}
interface Service {
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
}

function create_service(
  dependency: Service | undefined,
  failure_rate: number,
  max_retries: number,
  backoff_base: number
) {
  const service: Service = {
    request({ retry, time_since_first_attempt }) {
      // Retries are more likely to success the longer they wait.
      // Will always succeed after 1000ms.
      const scale = retry
        ? beta_dist_pdf(Math.min(time_since_first_attempt / 1000, 1), 1, 5) / 5
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

// TODO: record load: total number of requests sent to bottom service
function run(n = 10_000) {
  const call_depths = [2];
  const failure_rates = [0.01, 0.1, 0.9];
  const max_retry_values = [0, 3];
  const retry_strategies = ["all", "top_only"];
  const backoff_bases = [10, 100];

  const failure_type: "all" | "bottom_only" = "bottom_only" as
    | "all"
    | "bottom_only";

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

  const summaries: Array<Summary> = [];

  for (const {
    call_depth,
    failure_rate,
    max_retries,
    backoff_base,
    retry_strategy,
  } of combinations) {
    const client: Service = create_service(
      Array.from(Array(call_depth - 1)).reduce(
        (dependency) =>
          create_service(
            dependency,
            failure_type == "all" ? failure_rate : 0,
            retry_strategy == "all" ? max_retries : 0,
            backoff_base
          ),
        create_service(undefined, failure_rate, 0, 0)
      ),
      failure_type == "all" ? failure_rate : 0,
      max_retries,
      backoff_base
    );

    const results: Array<Result> = [];
    for (let step = 0; step < n; step++) {
      results.push(
        client.request({ retry: false, time_since_first_attempt: 0 })
      );
    }

    summaries.push({
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
    });
  }

  console.table(summaries);
}

const rand = erlang_dist.factory(5, 1);

// Assume each service does some actual work
function service_latency() {
  return rand();
}

run();
