set terminal png
set output "plots/line.png"

set key off
set border 3

set ylabel "Latency (ms)"

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#1864ab'

# Input: a newline-separated list of "$percentile $latency" pairs
plot '< cat -' with line
