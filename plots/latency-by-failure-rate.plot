set terminal png size 650,500 font "sans,14";

set border 3
set key tmargin

set decimalsign locale
set decimalsign "."
set format "%'.0f"

set xlabel "Failure rate (%)"
set ylabel "Latency (ms)"

set xtics nomirror
set ytics nomirror

set grid xtics ytics

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#477dca' linewidth 2
set linetype 2 linewidth 2

plot 'tmp/data.dat' using 3:7 title "Mean" with lines, \
     ''             using 3:8 title "P99" with lines
