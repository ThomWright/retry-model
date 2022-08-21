set terminal png
set output "plots/histo-freq.png"

set key off
set border 3

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#1864ab'

set ylabel "Frequency"
set xlabel "Latency (ms)"

bin_width = 0.5;
set boxwidth 0.25 absolute

bin_number(x) = floor(x/bin_width)

rounded(x) = bin_width * ( bin_number(x) + 0.5 )

# Input: a newline-separated list of latencies
plot '< cat -' using (rounded($1)):(1) \
  smooth frequency with boxes
