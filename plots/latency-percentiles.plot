set terminal png size 650,500 font "sans,14";

set key off
set border 3

set xlabel "Percentile"
set ylabel "Latency (ms)"

set xtics nomirror
set ytics nomirror

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#477dca' linewidth 2

# Input: a newline-separated list of "$percentile $latency" pairs
plot 'tmp/data.dat' with line
