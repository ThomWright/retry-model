const erlang_dist = require("@stdlib/random-base-erlang");
interface Result {
  latency: number;
  success: boolean;
}
interface Service {
  request({ retry }: { retry: boolean }): Result;
}
interface Summary {
  "Call depth": number;
  "Service failure rate": number;
  "Max retries": number;
  "Backoff base": number;
  Strategy: string;

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
    request({ retry }) {
      if (dependency != null) {
        let res = dependency.request({ retry: false });

        let retries = 0;
        let retry_latency = 0;
        while (res.success == false && retries < max_retries) {
          res = dependency.request({ retry: true });

          // Back off with jitter
          retry_latency += backoff_base * Math.pow(2, retries) * Math.random();
          retries++;
        }

        return {
          latency:
            res.latency +
            retry_latency +
            // If this is a retry, assume we can skip some work sometimes because we've already done it
            // TODO: don't skip work if this service was the cause of the failure (only skip if dependency failed)
            (retry ? Math.random() * service_latency() : service_latency()),
          success: res.success && Math.random() > failure_rate,
        };
      }
      return {
        latency: service_latency(),
        success: Math.random() > failure_rate,
      };
    },
  };
  return service;
}

function run(n = 10_000) {
  const call_depths = [3];
  const failure_rates = [0.01, 0.1, 0.8];
  const max_retry_values = [0, 3];
  const strategies = ["all", "top_only"];

  // TODO: model shorter backoff = more likely failure
  const backoff_bases = [10, 100];

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
                strategy: "none",
              },
            ]
          : backoff_bases.flatMap((backoff_base) =>
              strategies.map((strategy) => ({
                call_depth,
                failure_rate,
                max_retries,
                backoff_base,
                strategy,
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
    strategy,
  } of combinations) {
    const client: Service = create_service(
      Array.from(Array(call_depth)).reduce(
        (d) =>
          create_service(
            d,
            failure_rate,
            strategy == "all" ? max_retries : 0,
            backoff_base
          ),
        undefined
      ),
      failure_rate,
      max_retries,
      backoff_base
    );

    const results: Array<Result> = [];
    for (let step = 0; step < n; step++) {
      results.push(client.request({ retry: false }));
    }

    summaries.push({
      "Call depth": call_depth,
      "Service failure rate": failure_rate,
      "Max retries": max_retries,
      "Backoff base": backoff_base,
      Strategy: strategy,

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
